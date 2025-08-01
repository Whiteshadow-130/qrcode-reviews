
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Plus, Edit, Trash2, Loader2, Package } from 'lucide-react';
import ProductForm from './ProductForm';

const ProductManager = ({ campaign, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    if (!campaign) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({ title: "Error fetching products", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [campaign, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFormSubmit = async (productData) => {
    if (!user || !campaign) return;
    const isEditing = !!editingProduct;
    const submissionData = { ...productData, user_id: user.id, campaign_id: campaign.id };

    try {
      let error, data;
      if (isEditing) {
        ({ data, error } = await supabase.from('products').update(submissionData).eq('id', editingProduct.id).select().single());
      } else {
        ({ data, error } = await supabase.from('products').insert(submissionData).select().single());
      }

      if (error) throw error;

      toast({ title: `Product ${isEditing ? 'updated' : 'added'}!`, description: `Successfully ${isEditing ? 'updated' : 'added'} the product.` });
      setShowProductForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast({ title: `Error ${isEditing ? 'updating' : 'adding'} product`, description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast({ title: "Product deleted!", description: "The product has been removed from this campaign." });
      fetchProducts();
    } catch (error) {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="glass-effect border-0 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Products for "{campaign.name}"</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add or remove products associated with this campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 text-white animate-spin" /></div>
            ) : products.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No products added to this campaign yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map(product => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <img 
                        src={product.image_url || `https://via.placeholder.com/64?text=${product.title.charAt(0)}`}
                        alt={product.title}
                        className="w-12 h-12 rounded-md object-cover bg-gray-700"
                        />
                      <div>
                        <p className="font-medium text-white">{product.title}</p>
                        <p className="text-sm text-gray-400">ASIN: {product.asin}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setShowProductForm(true); }}>
                        <Edit className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-gray-700">
            <Button
              onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showProductForm && (
        <ProductForm
          onSubmit={handleFormSubmit}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          product={editingProduct}
        />
      )}
    </>
  );
};

export default ProductManager;
