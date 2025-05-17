'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Plus, Trash2, Edit, Save, LineChart } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AisleVisualizer from '../components/AisleVisualizer';

// TODO: Add pagination when product count exceeds 50

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    company: '',
    tag: '',
    quantity: 0,
    aisle_row: 0,
    aisle_column: 0,
    image_url: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setProducts(data);
    } catch (error) {
      // Add toast notification here later
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      company: product.company,
      tag: product.tag,
      quantity: product.quantity,
      aisle_row: product.aisle_row,
      aisle_column: product.aisle_column,
      image_url: product.image_url,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' || name === 'aisle_row' || name === 'aisle_column' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        alert("Product name cannot be empty");
        return;
      }
      
      const { error } = await supabase
        .from('products')
        .update(formData)
        .eq('id', editingProduct);
        
      if (error) throw error;
      
      fetchProducts();
      setEditingProduct(null);
    } catch (error) {
      alert(`Failed to update: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        fetchProducts();
      } catch (error) {
        alert(`Failed to delete: ${error.message}`);
      }
    }
  };

  const handleAddNew = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: 'New Product',
          price: 0,
          company: '',
          tag: '',
          quantity: 0,
          aisle_row: 1,
          aisle_column: 1,
          image_url: '',
        });
        
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      alert(`Failed to add product: ${error.message}`);
    }
  };

  const downloadCSV = () => {
    const headers = ['Product Name,Product Price,Product Company,Filter Tag,Quantity Available,Aisle Row,Aisle Column,Img URL'];
    const rows = products.map(p => 
      `${p.name},${p.price},${p.company},${p.tag},${p.quantity},${p.aisle_row},${p.aisle_column},${p.image_url}`
    );
    
    const csvContent = headers.concat(rows).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products-${new Date().toISOString().slice(0,10)}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <Link href="/products">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Products
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <LineChart className="mr-2 h-4 w-4" />
                  Analytics Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" size="sm" onClick={downloadCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Product Management</TabsTrigger>
              <TabsTrigger value="aisle">Aisle Visualization</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="mt-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-medium">Products</h2>
                  <Button size="sm" onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
                
                {/* Main products table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Tag</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Aisle</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Loading products...</TableCell>
                        </TableRow>
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">No products found.</TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              {editingProduct === product.id ? (
                                <Input 
                                  name="name" 
                                  value={formData.name} 
                                  onChange={handleChange} 
                                />
                              ) : (
                                product.name
                              )}
                            </TableCell>
                            <TableCell>
                              {editingProduct === product.id ? (
                                <Input 
                                  type="number" 
                                  name="price" 
                                  value={formData.price} 
                                  onChange={handleChange} 
                                  step="0.01"
                                />
                              ) : (
                                `$${product.price.toFixed(2)}`
                              )}
                            </TableCell>
                            <TableCell>
                              {editingProduct === product.id ? (
                                <Input 
                                  name="company" 
                                  value={formData.company} 
                                  onChange={handleChange} 
                                />
                              ) : (
                                product.company
                              )}
                            </TableCell>
                            <TableCell>
                              {editingProduct === product.id ? (
                                <Input 
                                  name="tag" 
                                  value={formData.tag} 
                                  onChange={handleChange} 
                                />
                              ) : (
                                product.tag
                              )}
                            </TableCell>
                            <TableCell>
                              {editingProduct === product.id ? (
                                <Input 
                                  type="number" 
                                  name="quantity" 
                                  value={formData.quantity} 
                                  onChange={handleChange} 
                                />
                              ) : (
                                product.quantity
                              )}
                            </TableCell>
                            <TableCell>
                              {editingProduct === product.id ? (
                                <div className="flex space-x-2">
                                  <Input 
                                    type="number" 
                                    name="aisle_row" 
                                    value={formData.aisle_row} 
                                    onChange={handleChange} 
                                    className="w-16"
                                  />
                                  <Input 
                                    type="number" 
                                    name="aisle_column" 
                                    value={formData.aisle_column} 
                                    onChange={handleChange} 
                                    className="w-16"
                                  />
                                </div>
                              ) : (
                                `${product.aisle_row}, ${product.aisle_column}`
                              )}
                            </TableCell>
                            <TableCell>
                              {editingProduct === product.id ? (
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={handleSave}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingProduct(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="aisle" className="mt-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-medium mb-4">Store Layout Visualization</h2>
                <AisleVisualizer products={products} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}