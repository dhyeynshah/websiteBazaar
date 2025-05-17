// All comments are made by ChatGPT and it 

"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Download, RefreshCw, AlertTriangle } from 'lucide-react';

export default function StockDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [activeTab, setActiveTab] = useState('overview');
  const [aisleData, setAisleData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('aisle_row', { ascending: true })
        .order('aisle_column', { ascending: true });
        
      if (error) throw error;
      
      setProducts(data);
      
      // Process data for visualizations
      processAisleData(data);
      identifyLowStockProducts(data);
      
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  function processAisleData(data) {
    // Group by aisle
    const aisleGroups = data.reduce((acc, product) => {
      const aisleKey = `Row ${product.aisle_row}, Col ${product.aisle_column}`;
      if (!acc[aisleKey]) {
        acc[aisleKey] = {
          name: aisleKey,
          totalProducts: 0,
          lowStock: 0,
          outOfStock: 0,
          value: 0
        };
      }
      
      acc[aisleKey].totalProducts += 1;
      acc[aisleKey].value += parseFloat(product.price) * product.quantity;
      
      if (product.quantity === 0) {
        acc[aisleKey].outOfStock += 1;
      } else if (product.quantity <= lowStockThreshold) {
        acc[aisleKey].lowStock += 1;
      }
      
      return acc;
    }, {});
    
    setAisleData(Object.values(aisleGroups));
  }

  function identifyLowStockProducts(data) {
    const lowStock = data.filter(product => 
      product.quantity <= lowStockThreshold
    ).sort((a, b) => a.quantity - b.quantity);
    
    setLowStockProducts(lowStock);
  }

  function downloadAisleData() {
    // Create data for aisle-wise bifurcation
    const aisleMap = {};
    products.forEach(product => {
      const aisleKey = `${product.aisle_row}-${product.aisle_column}`;
      if (!aisleMap[aisleKey]) {
        aisleMap[aisleKey] = [];
      }
      aisleMap[aisleKey].push({
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        tag: product.tag
      });
    });
    
    // Convert to CSV
    let csvContent = "Aisle Row,Aisle Column,Product Name,Quantity,Price,Tag\n";
    products.forEach(product => {
      csvContent += `${product.aisle_row},${product.aisle_column},"${product.name}",${product.quantity},${product.price},"${product.tag}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'aisle_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function generateAisleVisualMap() {
    // Group products by aisle
    const aisleMap = {};
    let maxRow = 0;
    let maxCol = 0;
    
    products.forEach(product => {
      const row = product.aisle_row;
      const col = product.aisle_column;
      
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
      
      const key = `${row}-${col}`;
      if (!aisleMap[key]) {
        aisleMap[key] = [];
      }
      aisleMap[key].push(product);
    });
    
    // Create visual grid representation
    const rows = [];
    for (let r = 1; r <= maxRow; r++) {
      const cols = [];
      for (let c = 1; c <= maxCol; c++) {
        const key = `${r}-${c}`;
        const products = aisleMap[key] || [];
        const lowStockCount = products.filter(p => p.quantity <= lowStockThreshold).length;
        const outOfStockCount = products.filter(p => p.quantity === 0).length;
        
        let status = 'good';
        if (outOfStockCount > 0) status = 'critical';
        else if (lowStockCount > 0) status = 'warning';
        
        cols.push(
          <div 
            key={key} 
            className={`p-2 border ${
              status === 'good' ? 'bg-green-100' : 
              status === 'warning' ? 'bg-amber-100' : 
              'bg-red-100'
            } rounded flex flex-col items-center justify-center h-24 w-24`}
          >
            <div className="font-bold">R{r}-C{c}</div>
            <div className="text-xs mt-1">{products.length} Items</div>
            {lowStockCount > 0 && (
              <div className="text-xs text-amber-600">{lowStockCount} Low</div>
            )}
            {outOfStockCount > 0 && (
              <div className="text-xs text-red-600">{outOfStockCount} Empty</div>
            )}
          </div>
        );
      }
      rows.push(
        <div key={r} className="flex gap-2 mb-2">
          {cols}
        </div>
      );
    }
    
    return rows;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stock Management Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchProducts}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button 
            onClick={downloadAisleData}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Download Aisle Data
          </Button>
        </div>
      </div>
      
      {lowStockProducts.length > 0 && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-600">Attention Required</AlertTitle>
          <AlertDescription>
            {lowStockProducts.length} products are running low on stock and need attention.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="aisle-map">Aisle Map</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock Alert ({lowStockProducts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory by Aisle</CardTitle>
                <CardDescription>Product distribution across store aisles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={aisleData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalProducts" name="Total Products" fill="#8884d8" />
                    <Bar dataKey="lowStock" name="Low Stock" fill="#ffc658" />
                    <Bar dataKey="outOfStock" name="Out of Stock" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value Distribution</CardTitle>
                <CardDescription>Value of stock across aisles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={aisleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {aisleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-700">Total Products</h3>
                    <p className="text-3xl font-bold">{products.length}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-amber-700">Low Stock Items</h3>
                    <p className="text-3xl font-bold">{lowStockProducts.length}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-red-700">Out of Stock</h3>
                    <p className="text-3xl font-bold">
                      {products.filter(product => product.quantity === 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="aisle-map">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Aisle Map</CardTitle>
              <CardDescription>Visual map of product locations and stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto p-4">
                {generateAisleVisualMap()}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span className="text-sm">Good Stock</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-amber-100 rounded"></div>
                  <span className="text-sm">Low Stock</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-100 rounded"></div>
                  <span className="text-sm">Critical/Empty</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need restocking soon</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  All products are well-stocked.
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <div className="text-sm text-gray-500">
                            Aisle: Row {product.aisle_row}, Column {product.aisle_column} · 
                            Tag: {product.tag} · Price: ${parseFloat(product.price).toFixed(2)}
                          </div>
                        </div>
                        {product.quantity === 0 ? (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Low Stock: {product.quantity} left
                          </span>
                        )}
                      </div>
                      <Progress 
                        value={(product.quantity / lowStockThreshold) * 100} 
                        className={`h-2 ${
                          product.quantity === 0 ? 'bg-red-200' : 'bg-amber-200'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}