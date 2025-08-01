import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const satisfactionOptions = [
  { value: 'very_satisfied', label: 'Very Satisfied', emoji: '😍' },
  { value: 'somewhat_satisfied', label: 'Somewhat Satisfied', emoji: '😊' },
  { value: 'neutral', label: 'Neither Satisfied Nor Dissatisfied', emoji: '😐' },
  { value: 'somewhat_dissatisfied', label: 'Somewhat Dissatisfied', emoji: '😕' },
  { value: 'very_dissatisfied', label: 'Very Dissatisfied', emoji: '😞' }
];

const Step1_ProductFeedback = ({ formData, setFormData, onSuccess, setAsin, campaignId, products, setVerified }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const hasProducts = products && products.length > 0;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductSelect = (productId) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setFormData(prev => ({ ...prev, productId: selectedProduct.id }));
      setAsin(selectedProduct.asin);
      setVerified(false); // Manual product selection is not SP-API verified
    }
  };

  const fetchASIN = async () => {
    setLoading(true);
    try {
      // Check if order ID has already been used for this campaign
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('order_id', formData.orderNumber)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // 'PGRST116' means no rows found, which is good
        throw checkError;
      }

      if (existingReview) {
        throw new Error("This Order ID has already been used for this campaign.");
      }

      const { data, error } = await supabase.functions.invoke('get-amazon-asin', {
          body: { campaignId, orderId: formData.orderNumber },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setAsin(data.asin);
      setVerified(true);
      toast({
        title: "Order verified!",
        description: "Your Amazon order has been successfully verified via SP-API.",
        className: 'bg-success text-white'
      });
      onSuccess();

    } catch (error) {
      toast({
        title: "Verification failed",
        description: error.message || "Unable to verify your order. Please check the Order ID and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.satisfaction || !formData.usedFor7Days) {
      toast({ title: "Missing information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (hasProducts) {
      if (!formData.productId) {
        toast({ title: "Product not selected", description: "Please select the product you are reviewing.", variant: "destructive" });
        return;
      }
      onSuccess();
    } else {
      if (!formData.orderNumber) {
        toast({ title: "Missing information", description: "Please provide your Amazon Order Number.", variant: "destructive" });
        return;
      }
      fetchASIN();
    }
  };

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Step 1: Product Feedback</CardTitle>
          <CardDescription>Tell us about your experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {hasProducts ? (
              <div className="space-y-2">
                <Label>Which product are you reviewing? *</Label>
                <Select onValueChange={handleProductSelect} value={formData.productId || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-3">
                          <img src={product.image_url} alt={product.title} className="w-8 h-8 rounded-sm object-cover" />
                          <span>{product.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Amazon Order Number *</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g., 123-1234567-1234567"
                  value={formData.orderNumber}
                  onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>How satisfied are you? *</Label>
              <div className="grid grid-cols-1 gap-3">
                {satisfactionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('satisfaction', option.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.satisfaction === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Used for more than 7 days? *</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Yes', 'No'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleInputChange('usedFor7Days', option)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      formData.usedFor7Days === option
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/20'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {loading ? 'Verifying...' : 'Continue'}
              {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step1_ProductFeedback;