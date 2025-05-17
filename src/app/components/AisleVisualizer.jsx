'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Search, Edit, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AisleEditor from './AisleEditor';

export default function AisleVisualizer({ products, onUpdateProducts }) {
  const canvasRef = useRef(null);
  const [maxRow, setMaxRow] = useState(0);
  const [maxColumn, setMaxColumn] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  useEffect(() => {
    if (!products || products.length === 0) return;
    
    const rows = Math.max(...products.map(p => p.aisle_row || 0)) || 1;
    const cols = Math.max(...products.map(p => p.aisle_column || 0)) || 1;
    
    setMaxRow(rows);
    setMaxColumn(cols);
  }, [products]);
  
  useEffect(() => {
    if (!editMode) {
      renderVisualization();
    }
  }, [products, maxRow, maxColumn, selectedProduct, editMode]);
  
  useEffect(() => {
    if (!searchTerm || !products) {
      setSearchResults([]);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const results = products.filter(product => 
      product.name.toLowerCase().includes(term)
    ).slice(0, 5);
    
    setSearchResults(results);
  }, [searchTerm, products]);
  
  const renderVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !products || products.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const cellWidth = Math.min(80, canvas.width / (maxColumn + 1));
    const cellHeight = Math.min(60, canvas.height / (maxRow + 1));
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Grid
    for (let i = 0; i <= maxRow; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(canvas.width, i * cellHeight);
      ctx.stroke();
    }
    
    for (let i = 0; i <= maxColumn; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, canvas.height);
      ctx.stroke();
    }
    
    // Labels
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    
    for (let i = 1; i <= maxRow; i++) {
      ctx.fillText(`Row ${i}`, 5, i * cellHeight - cellHeight/2 + 4);
    }
    
    for (let i = 1; i <= maxColumn; i++) {
      ctx.fillText(`Col ${i}`, i * cellWidth - cellWidth/2, 15);
    }
    
    // Store entrance
    const doorX = Math.floor(maxColumn / 2) * cellWidth;
    const doorY = maxRow * cellHeight;
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.rect(doorX, doorY - 10, cellWidth, 10);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('DOOR', doorX + 5, doorY - 2);
    
    // Draw products on map
    products.forEach(product => {
      if (!product.aisle_row || !product.aisle_column) return;
      
      const x = product.aisle_column * cellWidth - cellWidth/2;
      const y = product.aisle_row * cellHeight - cellHeight/2;
      
      ctx.fillStyle = getColorByTag(product.tag);
      ctx.fillRect(
        product.aisle_column * cellWidth - cellWidth,
        product.aisle_row * cellHeight - cellHeight,
        cellWidth,
        cellHeight
      );
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      const name = truncateText(product.name, 12);
      ctx.fillText(
        name,
        product.aisle_column * cellWidth - cellWidth + 5,
        product.aisle_row * cellHeight - cellHeight/2 + 4
      );
    });
    
    // Draw path to selected product
    if (selectedProduct && selectedProduct.aisle_row && selectedProduct.aisle_column) {
      const startX = doorX + cellWidth / 2;
      const startY = doorY;
      
      const endX = selectedProduct.aisle_column * cellWidth - cellWidth/2;
      const endY = selectedProduct.aisle_row * cellHeight - cellHeight/2;
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, startY);
      ctx.lineTo(endX, endY);
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Highlight selected
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selectedProduct.aisle_column * cellWidth - cellWidth,
        selectedProduct.aisle_row * cellHeight - cellHeight,
        cellWidth,
        cellHeight
      );
    }
  };
  
  const getColorByTag = (tag) => {
    if (!tag) return '#3b82f6';
    
    const tags = ['grocery', 'electronics', 'clothing', 'home', 'office', 'toys'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    
    const index = tags.indexOf(tag.toLowerCase());
    if (index >= 0) return colors[index];
    
    // Hash for consistent color
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 50%)`;
  };
  
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  };
  
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'store-layout.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setSearchResults([]);
  };
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setSelectedProduct(null);
    setSearchTerm('');
  };
  
  const generateDirections = () => {
    if (!selectedProduct) return null;
    
    const doorX = Math.floor(maxColumn / 2);
    const productCol = selectedProduct.aisle_column;
    const productRow = selectedProduct.aisle_row;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium mb-2">Directions to {selectedProduct.name}</h4>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Enter through the front door</li>
          <li>
            {doorX < productCol 
              ? `Walk right to column ${productCol}` 
              : doorX > productCol 
                ? `Walk left to column ${productCol}` 
                : "Continue straight ahead"}
          </li>
          <li>Follow the aisle to row {productRow}</li>
          <li>Look for {selectedProduct.name} on the shelf</li>
        </ol>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Store Layout Map</h3>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={editMode ? "outline" : "default"}
              onClick={toggleEditMode}
            >
              <Edit className="mr-2 h-4 w-4" />
              {editMode ? "Cancel Editing" : "Edit Layout"}
            </Button>
            {!editMode && (
              <Button size="sm" onClick={downloadImage}>
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </Button>
            )}
          </div>
        </div>
        
        {!editMode && (
          <div className="mb-4 relative">
            <div className="flex">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Search for a product..." 
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-8"
                />
                
                {searchResults.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white shadow-lg rounded-md border z-10">
                    {searchResults.map(product => (
                      <div
                        key={product.id || product.name}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectProduct(product)}
                      >
                        {product.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {editMode ? (
          <AisleEditor 
            products={products}
            maxRow={maxRow}
            maxColumn={maxColumn}
            onSave={(updatedProducts) => {
              onUpdateProducts(updatedProducts);
              setEditMode(false);
            }}
          />
        ) : products && products.length > 0 ? (
          <div className="border rounded-lg p-2 overflow-auto">
            <canvas 
              ref={canvasRef} 
              width={(maxColumn + 1) * 80} 
              height={(maxRow + 1) * 60}
              className="mx-auto"
            />
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg">
            No product data available to visualize.
          </div>
        )}
        
        {!editMode && selectedProduct && generateDirections()}
      </div>
      
      <div className="border rounded-lg p-4 w-full">
        <h3 className="font-medium mb-2">Color Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['grocery', 'electronics', 'clothing', 'home', 'office', 'toys'].map(tag => (
            <div key={tag} className="flex items-center">
              <div 
                className="w-4 h-4 mr-2 rounded-full" 
                style={{ backgroundColor: getColorByTag(tag) }}
              />
              <span className="text-sm capitalize">{tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}