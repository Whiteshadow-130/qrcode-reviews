import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Upload, X, FileImage as ImageIcon, Loader2 } from 'lucide-react';

const ProductForm = ({ onSubmit, onClose, product }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: product?.title || '',
    asin: product?.asin || '',
    image_url: product?.image_url || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.asin) {
      toast({
        title: "Missing information",
        description: "Product Title and ASIN are required.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    let finalImageUrl = formData.image_url;

    if (imageFile) {
      const fileName = `${user.id}/products/${Date.now()}_${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('campaign-images').upload(fileName, imageFile);
      if (uploadError) {
        toast({ title: "Image upload failed", description: uploadError.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('campaign-images').getPublicUrl(uploadData.path);
      finalImageUrl = urlData.publicUrl;
    }
    
    await onSubmit({ ...formData, image_url: finalImageUrl });
    setUploading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the product details.' : 'Add a new product to your catalog.'}
          </DialogDescription>
        </DialogHeader>
        
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label>Product Image</Label>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div
              className="w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer hover:border-foreground/50 transition-colors relative"
              onClick={() => fileInputRef.current.click()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover rounded-md" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); handleInputChange('image_url', ''); }}
                  >
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
            <Label htmlFor="productTitle">Product Title *</Label>
            <Input
              id="productTitle"
              placeholder="e.g., Ergonomic Office Chair"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productAsin">ASIN *</Label>
            <Input
              id="productAsin"
              placeholder="e.g., B08L8KC4B6"
              value={formData.asin}
              onChange={(e) => handleInputChange('asin', e.target.value)}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1"
              disabled={uploading}
            >
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;