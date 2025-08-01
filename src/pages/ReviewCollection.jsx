import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, AlertTriangle } from 'lucide-react';
import StepIndicator from '@/components/review/StepIndicator';
import Step1_ProductFeedback from '@/components/review/Step1_ProductFeedback';
import Step2_CustomerDetails from '@/components/review/Step2_CustomerDetails';
import Step3_WriteReview from '@/components/review/Step3_WriteReview';
import Step4_ThankYou from '@/components/review/Step4_ThankYou';
import { Card, CardContent } from '@/components/ui/card';

const ReviewCollection = () => {
  const { campaignId } = useParams();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [campaign, setCampaign] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asin, setAsin] = useState('');
  const [isVerified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    satisfaction: '',
    usedFor7Days: '',
    fullName: '',
    email: '',
    contactNumber: '',
    reviewText: '',
    productId: null,
    reviewScreenshot: null,
  });

  const fetchCampaignData = useCallback(async () => {
    if (!campaignId) {
      setError("No campaign ID provided.");
      setLoading(false);
      return;
    }

    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*, products:campaign_products(product_id)')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaignData) throw new Error(campaignError?.message || "Campaign not found.");
      setCampaign(campaignData);

      const productIds = campaignData.products.map(p => p.product_id);

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
        
        if (productsError) throw productsError;
        setProducts(productsData || []);
      }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    let screenshotUrl = null;

    if (formData.reviewScreenshot) {
      const file = formData.reviewScreenshot;
      const fileName = `${campaignId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('review-screenshots')
        .upload(fileName, file);
      
      if (uploadError) {
        toast({ title: "Screenshot upload failed", description: uploadError.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('review-screenshots').getPublicUrl(uploadData.path);
      screenshotUrl = urlData.publicUrl;
    }

    const reviewData = {
      campaign_id: campaignId,
      order_id: formData.orderNumber || 'N/A',
      product_id: formData.productId,
      asin,
      customer_name: formData.fullName,
      customer_email: formData.email,
      customer_phone: formData.contactNumber,
      satisfaction_rating: formData.satisfaction,
      used_over_7_days: formData.usedFor7Days === 'Yes',
      review_text: formData.reviewText,
      marketplace: campaign?.marketplace,
      is_verified: isVerified,
      review_screenshot_url: screenshotUrl,
      submitted_at: new Date().toISOString(),
      gift_sent: false,
    };

    try {
      const { error: insertError } = await supabase.from('reviews').insert(reviewData);
      if (insertError) {
        if (insertError.code === '23505') { // unique_violation
          throw new Error("This Order ID has already been used for this campaign.");
        }
        throw insertError;
      }
      
      toast({ title: "Review submitted!", description: "Thank you for your feedback!", className: 'bg-success text-white' });
      handleNextStep();
    } catch (e) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-foreground text-lg">Loading Campaign...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full soft-shadow"><CardContent className="p-8 text-center"><AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" /><h2 className="text-xl font-semibold text-foreground mb-2">Campaign Not Found</h2><p className="text-muted-foreground">{error || "This campaign doesn't exist or is no longer active."}</p></CardContent></Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Leave a Review - {campaign.name}</title>
        <meta name="description" content={`Share your experience for the campaign: ${campaign.name}.`} />
      </Helmet>
      
      <div className="min-h-screen p-4 flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl">
          {campaign.image_url && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <img src={campaign.image_url} alt={campaign.name} className="w-full h-48 object-cover rounded-lg soft-shadow" />
            </motion.div>
          )}
          {campaign.promo_message && currentStep < 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4 text-center text-primary font-medium">
              {campaign.promo_message}
            </motion.div>
          )}

          <StepIndicator currentStep={currentStep} campaignName={campaign.name} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            {currentStep === 1 && <Step1_ProductFeedback formData={formData} setFormData={setFormData} onSuccess={handleNextStep} setAsin={setAsin} campaignId={campaignId} products={products} setVerified={setVerified} />}
            {currentStep === 2 && <Step2_CustomerDetails formData={formData} setFormData={setFormData} onNext={handleNextStep} onBack={handlePrevStep} />}
            {currentStep === 3 && <Step3_WriteReview formData={formData} setFormData={setFormData} asin={asin} marketplace={campaign.marketplace} onNext={handleFinalSubmit} onBack={handlePrevStep} loading={submitting} />}
            {currentStep === 4 && <Step4_ThankYou formData={formData} campaign={campaign} />}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ReviewCollection;