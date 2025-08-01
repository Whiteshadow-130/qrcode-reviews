import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2, QrCode, Eye, Link as LinkIcon, Download } from 'lucide-react';
import CampaignForm from '@/components/CampaignForm';
import Pagination from '@/components/Pagination';
import QRCode from 'qrcode';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 6;

const fetchCampaigns = async (userId, page) => {
  if (!userId) return { data: [], count: 0 };
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, count };
};

const ManageCampaigns = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPage, setCurrentPage] = useState(1);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);

  useEffect(() => {
    if (location.state?.openForm) {
      setEditingCampaign(null);
      setShowCampaignForm(true);
    }
  }, [location.state]);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', user?.id, currentPage],
    queryFn: () => fetchCampaigns(user?.id, currentPage),
    enabled: !!user?.id,
  });

  const campaigns = data?.data ?? [];
  const totalCampaigns = data?.count ?? 0;
  const totalPages = Math.ceil(totalCampaigns / ITEMS_PER_PAGE);

  const campaignMutation = useMutation({
    mutationFn: async ({ campaignData, productIds, isEditing }) => {
      const { ...dataToUpsert } = { ...campaignData, user_id: user.id };
      
      const { data: campaignResult, error: campaignError } = await supabase
        .from('campaigns')
        .upsert(isEditing ? { id: editingCampaign.id, ...dataToUpsert } : dataToUpsert)
        .select()
        .single();
      
      if (campaignError) throw campaignError;
      
      const campaignId = campaignResult.id;
      
      await supabase.from('campaign_products').delete().eq('campaign_id', campaignId);

      if (productIds && productIds.length > 0) {
        const productLinks = productIds.map(productId => ({ campaign_id: campaignId, product_id: productId }));
        await supabase.from('campaign_products').insert(productLinks);
      }
    },
    onSuccess: (_, { isEditing }) => {
      toast({ title: `Campaign ${isEditing ? 'updated' : 'created'} successfully!`, className: 'bg-success text-white' });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCampaignForm(false);
      setEditingCampaign(null);
    },
    onError: (error, { isEditing }) => {
      toast({ title: `Error ${isEditing ? 'updating' : 'creating'} campaign`, description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId) => {
      await supabase.from('campaigns').delete().eq('id', campaignId);
    },
    onSuccess: () => {
      toast({ title: "Campaign deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDeletingCampaign(null);
    },
    onError: (error) => {
      toast({ title: "Error deleting campaign", description: error.message, variant: "destructive" });
    },
  });

  const handleCampaignFormSubmit = (formData) => {
    const { productIds, ...campaignData } = formData;
    campaignMutation.mutate({ campaignData, productIds, isEditing: !!editingCampaign });
  };

  const copyCampaignUrl = (campaignId) => {
    const url = `${window.location.origin}/review/${campaignId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "URL Copied!", description: "Campaign URL copied to clipboard." });
  };

  const downloadQrCode = async (campaign) => {
    const url = `${window.location.origin}/review/${campaign.id}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2, color: { dark: '#1F2937', light: '#F9FAFB' } });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${campaign.name.replace(/\s+/g, '_')}_qr_code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'QR Code downloaded!' });
    } catch (err) {
      toast({ title: 'Failed to generate QR code', variant: 'destructive' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Manage Campaigns - ReviewFlow</title>
      </Helmet>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Campaigns</h1>
            <p className="text-muted-foreground mt-1">Create, edit, and manage your review collection campaigns.</p>
          </div>
          <Button onClick={() => { setEditingCampaign(null); setShowCampaignForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6">Create your first review collection campaign to get started.</p>
              <Button onClick={() => setShowCampaignForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <motion.div key={campaign.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="flex flex-col h-full overflow-hidden">
                    <img src={campaign.image_url || `https://via.placeholder.com/400x200/E5E7EB/1F2937?text=${encodeURIComponent(campaign.name)}`} alt={campaign.name} className="w-full h-40 object-cover bg-secondary" />
                    <CardHeader>
                      <CardTitle className="truncate text-xl">{campaign.name}</CardTitle>
                      <CardDescription>{campaign.marketplace}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-end">
                       <div className="flex space-x-2 pt-4 border-t">
                         <Button size="sm" variant="outline" onClick={() => navigate(`/campaigns/${campaign.id}`)} className="flex-1"><Eye className="h-4 w-4 mr-2" />View</Button>
                         <Button size="sm" variant="secondary" onClick={() => { setEditingCampaign(campaign); setShowCampaignForm(true); }}><Edit className="h-4 w-4" /></Button>
                         <Button size="sm" variant="destructive" onClick={() => setDeletingCampaign(campaign)}><Trash2 className="h-4 w-4" /></Button>
                       </div>
                       <div className="flex space-x-2 pt-2">
                         <Button size="sm" variant="outline" onClick={() => copyCampaignUrl(campaign.id)} className="flex-1"><LinkIcon className="h-4 w-4 mr-2" />Copy URL</Button>
                         <Button size="sm" variant="outline" onClick={() => downloadQrCode(campaign)} className="flex-1"><Download className="h-4 w-4 mr-2" />QR Code</Button>
                       </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      {showCampaignForm && <CampaignForm onSubmit={handleCampaignFormSubmit} onClose={() => { setShowCampaignForm(false); setEditingCampaign(null); navigate('/campaigns', { replace: true }); }} campaign={editingCampaign} />}
      
      <AlertDialog open={!!deletingCampaign} onOpenChange={() => setDeletingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the "{deletingCampaign?.name}" campaign and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingCampaign.id)} disabled={deleteMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageCampaigns;