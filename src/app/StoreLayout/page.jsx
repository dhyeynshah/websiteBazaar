// All comments are made by ChatGPT

'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import AisleVisualizer from '@/components/AisleVisualizer';
import { useToast } from '@/components/ui/use-toast';

export default function StoreLayoutPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error loading products',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProductsInSupabase = async (updatedProducts) => {
    setSaving(true);
    try {
      // Process each product to update its aisle information
      for (const product of updatedProducts) {
        const { id, aisle_id, aisle_name, aisle_row, aisle_column, tag, _layout_metadata } = product;
        
        const { error } = await supabase
          .from('products')
          .update({
            aisle_id,
            aisle_name,
            aisle_row,
            aisle_column,
            tag,
            _layout_metadata
          })
          .eq('id', id);
        
        if (error) throw error;
      }
      
      toast({
        title: 'Layout saved successfully',
        description: 'Your store layout has been updated.',
      });
      
      // Refresh products from the database
      fetchProducts();
    } catch (error) {
      console.error('Error updating products:', error);
      toast({
        title: 'Error saving layout',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Store Layout Manager</h1>
      
      {saving && (
        <div className="bg-blue-50 p-4 mb-6 rounded-lg flex items-center">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          <span>Saving your layout changes...</span>
        </div>
      )}
      
      <AisleVisualizer 
        products={products} 
        onUpdateProducts={updateProductsInSupabase} 
      />
    </div>
  );
}