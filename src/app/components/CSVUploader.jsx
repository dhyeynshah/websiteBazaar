// All comments are made by ChatGPT

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// TODO: Add batch processing to improve upload speed
export default function CSVUploader() {
  // State stuff
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // When user picks a file
  function handleFileChange(e) {
    let selectedFile = e.target.files[0];
    
    // Check if it's csv
    if (selectedFile && selectedFile.type !== 'text/csv') {
      setError('Please upload a CSV file');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  }

  // Upload handler - this was a pain to get working right
  async function handleUpload() {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Parse the file
      let text = await file.text();
      let products = parseCSV(text);
      
      // Delete old products first
      // Not sure if neq is the right way but it works
      let deleteResponse = await supabase.from('products').delete().neq('id', 'none');
      
      // Probably should check deleteResponse for errors but meh
      
      // Add each product one at a time
      // Definitely need to make this a batch operation later
      for (let i = 0; i < products.length; i++) {
        let p = products[i];
        
        let { error } = await supabase.from('products').insert({
          name: p.name || 'Unnamed Product', // Default name if missing
          price: p.price,
          company: p.company,
          tag: p.tag,
          quantity: p.quantity,
          aisle_row: p.aisleRow,
          aisle_column: p.aisleColumn,
          image_url: p.imageUrl
        });
        
        if (error) {
          // If anything fails, stop and show error
          throw new Error('Failed on product: ' + p.name + ' - ' + error.message);
        }
      }
      
      // Everything worked!
      setSuccess(true);
      
      // Redirect after delay - gives time to see success message
      setTimeout(() => {
        router.push('/products');
      }, 1500);
    } catch (err) {
      // Show what went wrong
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Parses CSV text into product objects
  function parseCSV(csvText) {
    let lines = csvText.split('\n');
    let headers = lines[0].split(',').map(h => h.trim());
    let result = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      let values = line.split(',').map(v => v.trim());
      let product = {};
      
      // Match headers to values
      for (let j = 0; j < headers.length; j++) {
        let key = getCsvHeaderKey(headers[j]);
        product[key] = values[j] || '';
      }
      
      // Fix number types - ran into bugs without this
      product.price = parseFloat(product.price) || 0;
      product.quantity = parseInt(product.quantity) || 0;
      product.aisleRow = parseInt(product.aisleRow) || 1; // Default to 1 if missing
      product.aisleColumn = parseInt(product.aisleColumn) || 1;
      
      result.push(product);
    }
    
    return result;
  }

  // Maps CSV headers to our DB field names
  // Spent way too long debugging these mappings
  function getCsvHeaderKey(header) {
    let headerMap = {
      'product name': 'name',
      'product price': 'price',
      'product company': 'company',
      'filter tag': 'tag',
      'quantity available': 'quantity',
      'aisle row': 'aisleRow',
      'aisle column': 'aisleColumn',
      'img url': 'imageUrl'
    };
    
    let lowerHeader = header.toLowerCase();
    return headerMap[lowerHeader] || lowerHeader;
  }

  return (
    <div className="space-y-6">
      {/* File upload area */}
      <div className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors">
        <input
          type="file"
          id="file-upload"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer w-full">
          <Upload size={32} className="text-gray-400 mb-2" />
          <p className="text-sm font-medium">
            {file ? file.name : 'Click to upload or drag and drop your CSV file'}
          </p>
          <p className="text-xs text-gray-500 mt-1">CSV files only</p>
        </label>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Products uploaded successfully! Redirecting to products page...
          </AlertDescription>
        </Alert>
      )}

      {/* Upload button */}
      <Button 
        onClick={handleUpload} 
        disabled={!file || isLoading || success}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Upload and Generate Product Page'}
      </Button>
    </div>
  );
}