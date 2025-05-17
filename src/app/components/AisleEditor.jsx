// All comments are made by ChatGPT

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AisleEditor({ products, maxRow, maxColumn, onSave }) {
  const [editableProducts, setEditableProducts] = useState([]);
  const [aisles, setAisles] = useState([]);
  const [draggedProduct, setDraggedProduct] = useState(null);
  const [draggedAisle, setDraggedAisle] = useState(null);
  const [isCreatingAisle, setIsCreatingAisle] = useState(false);
  const [newAisle, setNewAisle] = useState({ name: '', rows: 1, columns: 1, tag: 'grocery' });
  const canvasRef = useRef(null);
  const [rows, setRows] = useState(maxRow || 8);
  const [columns, setColumns] = useState(maxColumn || 10);
  const [doorPosition, setDoorPosition] = useState(Math.floor((maxColumn || 10) / 2));
  
  useEffect(() => {
    // Clone products to avoid modifying the original array
    setEditableProducts(JSON.parse(JSON.stringify(products || [])));
    
    // Initialize with some default aisles if none exist
    if (!products.some(p => p.aisle_row && p.aisle_column)) {
      const defaultAisles = [
        { id: 'aisle1', name: 'Grocery', x: 2, y: 2, width: 2, height: 4, tag: 'grocery' },
        { id: 'aisle2', name: 'Electronics', x: 5, y: 2, width: 2, height: 3, tag: 'electronics' },
        { id: 'aisle3', name: 'Clothing', x: 8, y: 2, width: 2, height: 4, tag: 'clothing' }
      ];
      setAisles(defaultAisles);
    } else {
      // Extract aisle information from products
      const existingAisles = extractAislesFromProducts(products);
      setAisles(existingAisles);
    }
  }, [products]);
  
  useEffect(() => {
    renderEditor();
  }, [editableProducts, aisles, rows, columns, doorPosition]);
  
  const extractAislesFromProducts = (products) => {
    const aisleMap = new Map();
    
    products.forEach(product => {
      if (product.aisle_row && product.aisle_column && product.aisle_id) {
        if (!aisleMap.has(product.aisle_id)) {
          aisleMap.set(product.aisle_id, {
            id: product.aisle_id,
            name: product.aisle_name || `Aisle ${product.aisle_id}`,
            x: product.aisle_column,
            y: product.aisle_row,
            width: 1,
            height: 1,
            tag: product.tag || 'grocery'
          });
        } else {
          const aisle = aisleMap.get(product.aisle_id);
          // Expand aisle dimensions if needed
          aisle.width = Math.max(aisle.width, product.aisle_column - aisle.x + 1);
          aisle.height = Math.max(aisle.height, product.aisle_row - aisle.y + 1);
        }
      }
    });
    
    return Array.from(aisleMap.values());
  };
  
  const renderEditor = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const cellWidth = Math.min(80, canvas.width / (columns + 1));
    const cellHeight = Math.min(60, canvas.height / (rows + 1));
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Draw rows
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(canvas.width, i * cellHeight);
      ctx.stroke();
    }
    
    // Draw columns
    for (let i = 0; i <= columns; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, canvas.height);
      ctx.stroke();
    }
    
    // Draw grid coordinates
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    
    // Row numbers (vertical)
    for (let i = 1; i <= rows; i++) {
      ctx.fillText(`${i}`, 5, i * cellHeight - cellHeight/2 + 4);
    }
    
    // Column numbers (horizontal)
    for (let i = 1; i <= columns; i++) {
      ctx.fillText(`${i}`, i * cellWidth - cellWidth/2, 15);
    }
    
    // Draw door at the front
    const doorX = doorPosition * cellWidth;
    const doorY = rows * cellHeight;
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.rect(doorX, doorY - 10, cellWidth, 10);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('DOOR', doorX + 5, doorY - 2);
    
    // Draw aisles
    aisles.forEach(aisle => {
      // Draw aisle rectangle
      ctx.fillStyle = getColorByTag(aisle.tag);
      ctx.globalAlpha = 0.7; // Semi-transparent
      
      const x = aisle.x * cellWidth;
      const y = aisle.y * cellHeight;
      const width = aisle.width * cellWidth;
      const height = aisle.height * cellHeight;
      
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1.0;
      
      // Draw aisle name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(
        aisle.name,
        x + 5,
        y + 20
      );
      
      // Draw border to indicate draggable
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    });
    
    // Draw products in assigned aisles
    editableProducts.forEach(product => {
      if (product.aisle_row && product.aisle_column) {
        const x = product.aisle_column * cellWidth - cellWidth / 2;
        const y = product.aisle_row * cellHeight - cellHeight / 2;
        
        // Draw product indicator
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Draw outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };
  
  const getColorByTag = (tag) => {
    if (!tag) return '#3b82f6'; // Default blue
    
    const tags = ['grocery', 'electronics', 'clothing', 'home', 'office', 'toys'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    
    const index = tags.indexOf(tag.toLowerCase());
    if (index >= 0) return colors[index];
    
    // Generate a color based on tag string
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 50%)`;
  };
  
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellWidth = Math.min(80, canvas.width / (columns + 1));
    const cellHeight = Math.min(60, canvas.height / (rows + 1));
    
    // Check if clicking on an aisle
    const clickedAisle = aisles.find(aisle => {
      const aisleX = aisle.x * cellWidth;
      const aisleY = aisle.y * cellHeight;
      const aisleWidth = aisle.width * cellWidth;
      const aisleHeight = aisle.height * cellHeight;
      
      return x >= aisleX && x <= aisleX + aisleWidth && 
             y >= aisleY && y <= aisleY + aisleHeight;
    });
    
    if (clickedAisle) {
      setDraggedAisle({
        ...clickedAisle,
        offsetX: x - (clickedAisle.x * cellWidth),
        offsetY: y - (clickedAisle.y * cellHeight)
      });
    }
    
    // Check if clicking on door for repositioning
    const doorX = doorPosition * cellWidth;
    const doorY = rows * cellHeight;
    
    if (x >= doorX && x <= doorX + cellWidth && y >= doorY - 10 && y <= doorY) {
      // Start door drag
      const doorDrag = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // Calculate new door position (snap to grid)
        const col = Math.max(0, Math.min(columns, Math.floor(x / cellWidth)));
        setDoorPosition(col);
      };
      
      const stopDoorDrag = () => {
        document.removeEventListener('mousemove', doorDrag);
        document.removeEventListener('mouseup', stopDoorDrag);
      };
      
      document.addEventListener('mousemove', doorDrag);
      document.addEventListener('mouseup', stopDoorDrag);
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (!draggedAisle) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellWidth = Math.min(80, canvas.width / (columns + 1));
    const cellHeight = Math.min(60, canvas.height / (rows + 1));
    
    // Calculate new grid position (snap to grid)
    const gridX = Math.max(1, Math.min(
      columns - draggedAisle.width + 1,
      Math.floor((x - draggedAisle.offsetX) / cellWidth) + 1
    ));
    const gridY = Math.max(1, Math.min(
      rows - draggedAisle.height + 1,
      Math.floor((y - draggedAisle.offsetY) / cellHeight) + 1
    ));
    
    // Update aisle position
    setAisles(aisles.map(aisle => 
      aisle.id === draggedAisle.id 
        ? { ...aisle, x: gridX, y: gridY } 
        : aisle
    ));
    
    // Update products that are in this aisle
    setEditableProducts(products.map(product => {
      if (product.aisle_id === draggedAisle.id) {
        // Calculate relative position within the aisle
        const relativeCol = product.aisle_column - draggedAisle.x;
        const relativeRow = product.aisle_row - draggedAisle.y;
        
        return {
          ...product,
          aisle_column: gridX + relativeCol,
          aisle_row: gridY + relativeRow
        };
      }
      return product;
    }));
  };
  
  const handleCanvasMouseUp = () => {
    setDraggedAisle(null);
  };
  
  const handleProductDragStart = (e, product) => {
    setDraggedProduct(product);
    e.dataTransfer.setData('text/plain', product.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleAisleDrop = (e, aisleId) => {
    e.preventDefault();
    
    if (!draggedProduct) return;
    
    // Find the aisle by ID
    const targetAisle = aisles.find(a => a.id === aisleId);
    if (!targetAisle) return;
    
    // Assign product to this aisle at a random position within the aisle
    const randomCol = targetAisle.x + Math.floor(Math.random() * targetAisle.width);
    const randomRow = targetAisle.y + Math.floor(Math.random() * targetAisle.height);
    
    setEditableProducts(products.map(p => 
      p.id === draggedProduct.id 
        ? { 
            ...p, 
            aisle_id: aisleId, 
            aisle_name: targetAisle.name,
            aisle_column: randomCol,
            aisle_row: randomRow,
            tag: targetAisle.tag
          } 
        : p
    ));
    
    setDraggedProduct(null);
  };
  
  const handleUnassignProduct = (productId) => {
    setEditableProducts(products.map(p => 
      p.id === productId 
        ? { 
            ...p, 
            aisle_id: null, 
            aisle_name: null,
            aisle_column: null,
            aisle_row: null
          } 
        : p
    ));
  };
  
  const handleCreateAisle = () => {
    const id = `aisle${Date.now()}`;
    const { name, rows: height, columns: width, tag } = newAisle;
    
    // Create new aisle positioned near door
    const newAisleObj = {
      id,
      name,
      x: Math.max(1, doorPosition - Math.floor(width / 2)),
      y: Math.max(1, rows - height - 1),
      width: parseInt(width),
      height: parseInt(height),
      tag
    };
    
    setAisles([...aisles, newAisleObj]);
    setIsCreatingAisle(false);
    setNewAisle({ name: '', rows: 1, columns: 1, tag: 'grocery' });
  };
  
  const handleDeleteAisle = (aisleId) => {
    // Remove aisle
    setAisles(aisles.filter(a => a.id !== aisleId));
    
    // Unassign products from this aisle
    setEditableProducts(editableProducts.map(p => 
      p.aisle_id === aisleId 
        ? { 
            ...p, 
            aisle_id: null, 
            aisle_name: null,
            aisle_column: null,
            aisle_row: null
          } 
        : p
    ));
  };
  
  const handleSave = async () => {
    // Update products with their aisle information
    const updatedProducts = editableProducts.map(product => ({
      ...product,
      // Add door position as metadata
      _layout_metadata: { doorPosition }
    }));
    
    // Call the save callback with updated products
    onSave(updatedProducts);
  };
  
  return (
    <div className="flex flex-col">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Layout Settings</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="rows">Rows</Label>
              <Input 
                id="rows"
                type="number" 
                min="4"
                max="20"
                value={rows} 
                onChange={e => setRows(parseInt(e.target.value))} 
              />
            </div>
            <div>
              <Label htmlFor="columns">Columns</Label>
              <Input 
                id="columns"
                type="number" 
                min="4"
                max="20"
                value={columns}
                onChange={e => setColumns(parseInt(e.target.value))} 
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: You can drag the door at the bottom to reposition it.
          </p>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Aisles</h3>
            <Button size="sm" onClick={() => setIsCreatingAisle(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Aisle
            </Button>
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            {aisles.map(aisle => (
              <div 
                key={aisle.id}
                className="flex justify-between items-center p-2 hover:bg-gray-100 rounded"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleAisleDrop(e, aisle.id)}
              >
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded-full" 
                    style={{ backgroundColor: getColorByTag(aisle.tag) }}
                  />
                  <span>{aisle.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeleteAisle(aisle.id)}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-4">
        <div className="border rounded-lg p-2 overflow-auto">
          <canvas 
            ref={canvasRef} 
            width={(columns + 1) * 80} 
            height={(rows + 1) * 60}
            className="mx-auto"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          <p className="text-xs text-gray-500 text-center mt-2">
            Click and drag aisles to reposition them
          </p>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Unassigned Products</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {editableProducts.filter(p => !p.aisle_row || !p.aisle_column).map(product => (
              <div 
                key={product.id}
                className="p-2 text-sm border rounded hover:bg-gray-50 cursor-grab"
                draggable
                onDragStart={e => handleProductDragStart(e, product)}
              >
                {product.name}
              </div>
            ))}
            
            {editableProducts.filter(p => !p.aisle_row || !p.aisle_column).length === 0 && (
              <p className="text-gray-500 col-span-full text-center">All products are assigned to aisles</p>
            )}
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Assigned Products</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {editableProducts.filter(p => p.aisle_row && p.aisle_column).map(product => (
              <div key={product.id} className="flex justify-between p-2 text-sm border rounded hover:bg-gray-50">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 mr-2 rounded-full" 
                    style={{ backgroundColor: getColorByTag(product.tag) }}
                  />
                  <span>{product.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-5 w-5 ml-1"
                  onClick={() => handleUnassignProduct(product.id)}
                >
                  <Trash className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
            
            {editableProducts.filter(p => p.aisle_row && p.aisle_column).length === 0 && (
              <p className="text-gray-500 col-span-full text-center">No products are assigned to aisles yet</p>
            )}
          </div>
        </div>
        
        <Button className="mt-4" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Store Layout
        </Button>
      </div>
      
      {/* Create Aisle Dialog */}
      <Dialog open={isCreatingAisle} onOpenChange={setIsCreatingAisle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Aisle</DialogTitle>
            <DialogDescription>
              Add a new aisle to your store layout.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="aisle-name">Aisle Name</Label>
              <Input
                id="aisle-name"
                value={newAisle.name}
                onChange={e => setNewAisle({...newAisle, name: e.target.value})}
                placeholder="e.g. Fresh Produce"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aisle-rows">Height (rows)</Label>
                <Input
                  id="aisle-rows"
                  type="number"
                  min="1"
                  max={rows}
                  value={newAisle.rows}
                  onChange={e => setNewAisle({...newAisle, rows: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="aisle-columns">Width (columns)</Label>
                <Input
                  id="aisle-columns"
                  type="number"
                  min="1"
                  max={columns}
                  value={newAisle.columns}
                  onChange={e => setNewAisle({...newAisle, columns: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="aisle-tag">Category</Label>
              <Select 
                value={newAisle.tag} 
                onValueChange={value => setNewAisle({...newAisle, tag: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grocery">Grocery</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="toys">Toys</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingAisle(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAisle} disabled={!newAisle.name}>
              Create Aisle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}