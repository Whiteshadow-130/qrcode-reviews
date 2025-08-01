
import React, { useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, QrCode, Download, ArrowLeft, Eye, Edit } from 'lucide-react';
import QRCode from 'qrcode';
import ReviewsTable from '@/components/ReviewsTable';

const fetchCampaignDetails = async (campaignId) => {
  if (!campaignId) return null;

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  if (campaignError) throw campaignError;

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*, product:products(title, asin)')
    .eq('campaign_id', campaignId)
    .order('submitted_at', { ascending: false });
  if (reviewsError) throw reviewsError;
  
  return { campaign, reviews };
};

const ViewCampaign = () => {
  const { campaignId } = useParams();
  const { toast } = useToast();
  const qrCodeRef = useRef();

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetchCampaignDetails(campaignId),
    enabled: !!campaignId,
  });

  const generateAndDownloadQR = async () => {
    const url = `${window.location.origin}/review/${campaignId}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${data.campaign.name.replace(/\s+/g, '_')}_qr_code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'QR Code downloaded!' });
    } catch (err) {
      toast({ title: 'Failed to generate QR code', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-white" /></div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="glass-effect border-0 text-center p-8">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Error fetching campaign</h2>
          <p className="text-gray-400 mt-2">{error.message}</p>
        </Card>
      </div>
    );
  }

  const { campaign, reviews } = data;

  return (
    <>
      <Helmet>
        <title>{campaign.name} - ReviewFlow</title>
      </Helmet>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button asChild variant="ghost" className="mb-4 text-gray-400 hover:text-white hover:bg-gray-800/50">
            <Link to="/campaigns"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Campaigns</Link>
          </Button>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text">{campaign.name}</h1>
              <p className="text-gray-400 mt-1">{campaign.marketplace}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateAndDownloadQR} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <Download className="h-4 w-4 mr-2" /> Download QR
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-white mb-4">Reviews for this Campaign</h2>
            <ReviewsTable reviews={reviews || []} campaigns={[campaign]} loading={false} onUpdate={() => {}} />
          </div>
          <div>
            <div className="space-y-8 sticky top-8">
              <Card className="glass-effect border-0">
                <CardHeader>
                  <CardTitle className="text-white">QR Code</CardTitle>
                  <CardDescription className="text-gray-400">Share this with your customers.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center p-6 bg-white rounded-b-lg">
                  <canvas ref={qrCodeRef} />
                </CardContent>
              </Card>
               <Card className="glass-effect border-0">
                <CardHeader>
                  <CardTitle className="text-white">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaign.image_url && <img src={campaign.image_url} alt={campaign.name} className="w-full h-40 object-cover rounded-lg mb-4" />}
                  {campaign.promo_message && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-blue-300 text-sm">
                      {campaign.promo_message}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewCampaign;
