import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Upload, X, FileImage as ImageIcon, Loader2, Check, ChevronsUpDown, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const fetchProducts = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('products')
    .select('id, title, asin')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};


const CampaignForm = ({ onSubmit, onClose, campaign }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    marketplace: campaign?.marketplace || '',
    promo_message: campaign?.promo_message || '',
    image_url: campaign?.image_url || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(campaign?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { data: allProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['allProducts', user?.id],
    queryFn: () => fetchProducts(user?.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (campaign) {
      const fetchCampaignProducts = async () => {
        const { data, error } = await supabase.from('campaign_products').select('product_id').eq('campaign_id', campaign.id);
        if (!error) {
            setSelectedProductIds(data.map(p => p.product_id));
        }
      };
      fetchCampaignProducts();
    }
  }, [campaign]);

  const marketplaces = [
    { value: 'amazon.com', label: 'Amazon.com (US)' }, { value: 'amazon.co.uk', label: 'Amazon.co.uk (UK)' },
    { value: 'amazon.de', label: 'Amazon.de (Germany)' }, { value: 'amazon.fr', label: 'Amazon.fr (France)' },
    { value: 'amazon.it', label: 'Amazon.it (Italy)' }, { value: 'amazon.es', label: 'Amazon.es (Spain)' },
    { value: 'amazon.ca', label: 'Amazon.ca (Canada)' }, { value: 'amazon.in', label: 'Amazon.in (India)' },
    { value: 'amazon.com.au', label: 'Amazon.com.au (Australia)' }, { value: 'amazon.co.jp', label: 'Amazon.co.jp (Japan)' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.marketplace) {
      toast({ title: "Missing information", description: "Campaign Name and Marketplace are required.", variant: "destructive" });
      return;
    }

    setUploading(true);
    let finalImageUrl = formData.image_url;

    if (imageFile) {
      const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('campaign-images').upload(fileName, imageFile);
      if (uploadError) {
        toast({ title: "Image upload failed", description: uploadError.message, variant: "destructive" });
        setUploading(false); return;
      }
      const { data: urlData } = supabase.storage.from('campaign-images').getPublicUrl(uploadData.path);
      finalImageUrl = urlData.publicUrl;
    }

    await onSubmit({ ...formData, image_url: finalImageUrl, productIds: selectedProductIds });
    setUploading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
          <DialogDescription>{campaign ? 'Update the details for your campaign.' : 'Set up a new review collection campaign.'}</DialogDescription>
        </DialogHeader>
        
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label>Campaign Image</Label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary transition-colors relative" onClick={() => fileInputRef.current.click()}>
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Campaign preview" className="w-full h-full object-cover rounded-md" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); handleInputChange('image_url', ''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                  <p>Click to upload image</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignName">Campaign Name *</Label>
            <Input id="campaignName" placeholder="e.g., Wireless Headphones Review" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Amazon Marketplace *</Label>
            <Select value={formData.marketplace} onValueChange={(value) => handleInputChange('marketplace', value)}>
              <SelectTrigger><SelectValue placeholder="Select marketplace" /></SelectTrigger>
              <SelectContent>{marketplaces.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Link Products (Optional)</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between">
                  {selectedProductIds.length > 0 ? `${selectedProductIds.length} product(s) selected` : "Select products..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search by title or ASIN..." />
                  <CommandList>
                    <CommandEmpty>No products found.</CommandEmpty>
                    <CommandGroup>
                      {isLoadingProducts ? <CommandItem>Loading...</CommandItem> :
                       allProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.title} ${product.asin}`}
                          onSelect={() => {
                            const newSelection = selectedProductIds.includes(product.id)
                              ? selectedProductIds.filter(id => id !== product.id)
                              : [...selectedProductIds, product.id];
                            setSelectedProductIds(newSelection);
                          }}
                        >
                           <Check className={`mr-2 h-4 w-4 ${selectedProductIds.includes(product.id) ? "opacity-100" : "opacity-0"}`} />
                          <span>{product.title} <span className="text-xs text-muted-foreground ml-2">{product.asin}</span></span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex items-start text-xs text-muted-foreground p-2 bg-secondary rounded-md">
              <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>If you link products, customers will select from a list. If left empty, customers will be asked for their Amazon Order ID for SP-API verification.</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoMessage">Promotional Message</Label>
            <Textarea id="promoMessage" placeholder="e.g., Get ₹50 cashback on submitting a review!" value={formData.promo_message} onChange={(e) => handleInputChange('promo_message', e.target.value)} />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={uploading}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {uploading ? 'Saving...' : (campaign ? 'Save Changes' : 'Create Campaign')}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignForm;