import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, ExternalLink, Loader2, Upload, X } from 'lucide-react';

const reviewSuggestions = [
  "This product exceeded my expectations! The quality is outstanding.",
  "Great value for money. Would definitely recommend to others.",
  "Fast shipping and excellent customer service. Very satisfied!",
  "The product works exactly as described. Perfect for my needs.",
  "Amazing quality and durability. Worth every penny!"
];

const Step3_WriteReview = ({ formData, setFormData, asin, marketplace, onNext, onBack, loading }) => {
  const { toast } = useToast();
  const [showAmazonFlow, setShowAmazonFlow] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const insertSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, reviewText: suggestion }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, reviewScreenshot: file }));
    }
  };

  const openAmazonReview = () => {
    if (!marketplace || !asin) return;
    const reviewUrl = `https://www.${marketplace}/review/review-your-purchases/?asin=${asin}`;
    if (formData.reviewText) {
      navigator.clipboard.writeText(formData.reviewText);
      toast({
        title: "Review copied!",
        description: "Your review text has been copied. Paste it on Amazon's review page.",
      });
    }
    window.open(reviewUrl, '_blank');
    setShowAmazonFlow(true);
  };
  
  const canWriteReviewOnAmazon = formData.satisfaction === 'very_satisfied' || formData.satisfaction === 'somewhat_satisfied';

  const handleSubmit = () => {
    if (canWriteReviewOnAmazon && showAmazonFlow && !screenshot) {
      toast({
        title: "Screenshot required",
        description: "Please upload a screenshot of your submitted review on Amazon.",
        variant: "destructive"
      });
      return;
    }
    onNext();
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="soft-shadow">
        <CardHeader>
          <CardTitle>Step 3: Write Your Review</CardTitle>
          <CardDescription>Share your experience to help other customers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Quick Review Suggestions</Label>
            <div className="flex flex-wrap gap-2">
              {reviewSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewText">Your Review</Label>
            <Textarea
              id="reviewText"
              placeholder="Write your detailed review here..."
              value={formData.reviewText}
              onChange={(e) => handleInputChange('reviewText', e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          {canWriteReviewOnAmazon && !showAmazonFlow && (
            <Button type="button" onClick={openAmazonReview} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Write Review on Amazon
            </Button>
          )}

          {showAmazonFlow && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 bg-secondary p-4 rounded-lg"
            >
              <h4 className="font-semibold">Upload Review Screenshot</h4>
              <p className="text-sm text-muted-foreground">
                After submitting your review on Amazon, please take a screenshot and upload it here to complete the process.
              </p>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              {screenshotPreview ? (
                <div className="relative">
                  <img  src={screenshotPreview} alt="Screenshot preview" className="rounded-md max-h-48 w-auto mx-auto" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => { setScreenshot(null); setScreenshotPreview(null); setFormData(p => ({...p, reviewScreenshot: null})); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()} className="w-full border-dashed">
                  <Upload className="h-4 w-4 mr-2" />
                  Click to upload screenshot
                </Button>
              )}
            </motion.div>
          )}

          <div className="flex space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit} 
              className="flex-1" 
              disabled={loading || (canWriteReviewOnAmazon && showAmazonFlow && !screenshot)}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step3_WriteReview;