'use client';

import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableFilters, setAvailableFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        // Transform data to match our component expectations
        const transformedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          company: product.company,
          tag: product.tag,
          quantity: product.quantity,
          aisleRow: product.aisle_row,
          aisleColumn: product.aisle_column,
          imageUrl: product.image_url
        }));
        
        setProducts(transformedProducts);
        setFilteredProducts(transformedProducts);
        
        // Extract unique tags for filters
        const tags = Array.from(
          new Set(transformedProducts.map(product => product.tag).filter(Boolean))
        );
        setAvailableFilters(tags);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(product => 
          selectedTags.includes(product.tag)
        )
      );
    }
  }, [selectedTags, products]);

  const handleFilterChange = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Upload
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Product Catalog</h1>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Admin Update
              </Button>
            </Link>
          </div>
          
          {availableFilters.length > 0 && (
            <ProductFilters 
              filters={availableFilters}
              selectedFilters={selectedTags}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          )}
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found. Please upload a CSV file to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}