import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Star, Mail, Calendar, Package, Download, CheckCircle, AlertCircle, Gift, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Papa from 'papaparse';

const ReviewsTable = ({ reviews, campaigns, loading, onUpdate }) => {
  const { toast } = useToast();
  const [viewingScreenshot, setViewingScreenshot] = useState(null);

  const handleGiftSentChange = async (reviewId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ gift_sent: newStatus })
        .eq('id', reviewId);
      if (error) throw error;
      toast({ title: "Status updated!", description: "Gift sent status has been changed." });
      if(onUpdate) onUpdate();
    } catch (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const getSatisfactionColor = (satisfaction) => {
    switch (satisfaction) {
      case 'very_satisfied': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'somewhat_satisfied': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'neutral': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'somewhat_dissatisfied': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'very_dissatisfied': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getSatisfactionLabel = (satisfaction) => {
    return satisfaction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : 'Unknown Campaign';
  };

  const exportReviews = () => {
    if (reviews.length === 0) {
      toast({ title: "No reviews to export", variant: "destructive" });
      return;
    }
    const headers = ["Submitted At", "Campaign", "Order ID", "ASIN", "Product Title", "Customer Name", "Customer Email", "Satisfaction", "Review Text", "Marketplace", "Gift Sent", "Verified", "Screenshot URL"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + reviews.map(r => {
          const campaignName = getCampaignName(r.campaign_id);
          const row = [
            new Date(r.submitted_at).toISOString(),
            `"${campaignName.replace(/"/g, '""')}"`,
            r.order_id,
            r.asin || (r.product ? r.product.asin : ''),
            r.product ? `"${r.product.title.replace(/"/g, '""')}"` : '',
            `"${r.customer_name.replace(/"/g, '""')}"`,
            r.customer_email,
            r.satisfaction_rating,
            `"${(r.review_text || '').replace(/"/g, '""')}"`,
            r.marketplace,
            r.gift_sent,
            r.is_verified,
            r.review_screenshot_url || ''
          ];
          return row.join(",");
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reviews_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exporting reviews...", description: "Your CSV file is being downloaded." });
  };

  if (loading) {
    return <div className="text-center p-12 text-muted-foreground">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
          <p className="text-muted-foreground">Reviews will appear here once customers start submitting feedback</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={exportReviews} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{review.customer_name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Mail className="h-4 w-4 mr-2" />
                        {review.customer_email}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getSatisfactionColor(review.satisfaction_rating)}>
                      {getSatisfactionLabel(review.satisfaction_rating)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      <span>Order: {review.order_id}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2 text-foreground">ASIN:</span>
                      <span>{review.asin || (review.product ? review.product.asin : 'N/A')}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(review.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {review.review_text && (
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-foreground">Customer Review:</h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">{review.review_text}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap justify-between items-center text-sm text-muted-foreground pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <span>Campaign: {getCampaignName(review.campaign_id)}</span>
                      {review.is_verified ? (
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/40"><CheckCircle className="h-3 w-3 mr-1" /> SP-API Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-500 border-amber-500/40"><AlertCircle className="h-3 w-3 mr-1" /> Manual Verification</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 md:mt-0">
                       {review.review_screenshot_url && (
                        <Button variant="outline" size="sm" onClick={() => setViewingScreenshot(review.review_screenshot_url)}>
                          <Eye className="h-4 w-4 mr-2" /> View Screenshot
                        </Button>
                      )}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`gift-${review.id}`}
                          checked={!!review.gift_sent}
                          onCheckedChange={(checked) => handleGiftSentChange(review.id, !!checked)}
                        />
                        <Label htmlFor={`gift-${review.id}`} className="flex items-center"><Gift className="h-4 w-4 mr-2" /> Gift Sent</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      <Dialog open={!!viewingScreenshot} onOpenChange={() => setViewingScreenshot(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Screenshot</DialogTitle>
            <DialogDescription>Screenshot provided by the customer.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <img src={viewingScreenshot} alt="Review screenshot" className="max-w-full max-h-[70vh] mx-auto rounded-md" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewsTable;