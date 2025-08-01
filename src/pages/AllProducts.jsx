
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2, Package, Upload, Download } from 'lucide-react';
import ProductForm from '@/components/ProductForm';
import Pagination from '@/components/Pagination';
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

const ITEMS_PER_PAGE = 8;

const fetchProducts = async (userId, page) => {
  if (!userId) return { data: [], count: 0 };
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, count };
};

const AllProducts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', user?.id, currentPage],
    queryFn: () => fetchProducts(user?.id, currentPage),
    enabled: !!user?.id,
  });

  const products = data?.data ?? [];
  const totalProducts = data?.count ?? 0;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const mutation = useMutation({
    mutationFn: async ({ productData, isEditing }) => {
      const submissionData = { ...productData, user_id: user.id };
      if (isEditing) {
        const { error } = await supabase.from('products').update(submissionData).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(submissionData);
        if (error) throw error;
      }
    },
    onSuccess: (_, { isEditing }) => {
      toast({ title: `Product ${isEditing ? 'updated' : 'added'} successfully!` });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowProductForm(false);
      setEditingProduct(null);
    },
    onError: (error, { isEditing }) => {
      toast({ title: `Error ${isEditing ? 'updating' : 'adding'} product`, description: error.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Product deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
    },
  });

  const handleFormSubmit = (productData) => {
    mutation.mutate({ productData, isEditing: !!editingProduct });
  };
  
  const handleExportCSV = () => {
    if (!products || products.length === 0) {
        toast({ title: "No products to export", variant: "destructive" });
        return;
    }
    const csv = Papa.unparse(products.map(p => ({ title: p.title, asin: p.asin, image_url: p.image_url })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Products exported" });
  };
  
  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const productsToInsert = results.data
          .filter(row => row.title && row.asin)
          .map(row => ({
            title: row.title,
            asin: row.asin,
            image_url: row.image_url,
            user_id: user.id
          }));

        if (productsToInsert.length > 0) {
          const { error } = await supabase.from('products').insert(productsToInsert);
          if (error) {
            toast({ title: "Import failed", description: error.message, variant: "destructive" });
          } else {
            toast({ title: "Import successful", description: `${productsToInsert.length} products imported.` });
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }
        } else {
          toast({ title: "Import failed", description: "No valid products found in CSV file. Ensure 'title' and 'asin' columns are present.", variant: "destructive" });
        }
      },
      error: (error) => {
        toast({ title: "CSV parsing error", description: error.message, variant: "destructive" });
      }
    });
    event.target.value = null;
  };

  return (
    <>
      <Helmet><title>All Products - ReviewFlow</title></Helmet>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Products</h1>
            <p className="text-muted-foreground mt-1">Manage your entire product catalog here.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
            <Button variant="outline" onClick={() => fileInputRef.current.click()}><Upload className="h-4 w-4 mr-2" /> Import CSV</Button>
            <Button variant="outline" onClick={handleExportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
            <Button onClick={() => { setEditingProduct(null); setShowProductForm(true); }}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin" /></div>
        ) : products.length === 0 ? (
          <Card><CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Add your first product to get started.</p>
              <Button onClick={() => setShowProductForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Your First Product</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <motion.div key={product.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="flex flex-col h-full overflow-hidden">
                    <img src={product.image_url || `https://via.placeholder.com/400x200/e5e7eb/4b5563?text=${encodeURIComponent(product.title)}`} alt={product.title} className="w-full h-40 object-cover bg-muted" />
                    <CardHeader><CardTitle className="truncate">{product.title}</CardTitle><CardDescription>ASIN: {product.asin}</CardDescription></CardHeader>
                    <CardContent className="flex-grow flex items-end">
                      <div className="flex space-x-2 w-full">
                         <Button size="sm" variant="secondary" className="flex-1" onClick={() => { setEditingProduct(product); setShowProductForm(true); }}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                         <Button size="sm" variant="destructive" onClick={() => setDeletingProduct(product)}><Trash2 className="h-4 w-4" /></Button>
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

      {showProductForm && <ProductForm onSubmit={handleFormSubmit} onClose={() => { setShowProductForm(false); setEditingProduct(null); }} product={editingProduct} />}
      
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the product "{deletingProduct?.title}". This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingProduct.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AllProducts;
