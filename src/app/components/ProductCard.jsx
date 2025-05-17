import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function ProductCard({ product }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="relative h-48 bg-gray-100">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/api/placeholder/400/320";
            }}
          />
        ) : (
          <img src="/api/placeholder/400/320" alt="placeholder" className="w-full h-full object-cover" />
        )}
        
        {product.quantity <= 5 && product.quantity > 0 && (
          <Badge className="absolute top-2 right-2 bg-yellow-500">
            Only {product.quantity} left
          </Badge>
        )}
        
        {product.quantity === 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            Out of stock
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg truncate">{product.name}</h3>
          <span className="font-bold text-lg">${parseFloat(product.price).toFixed(2)}</span>
        </div>
        
        <p className="text-sm text-gray-500 mb-2">{product.company}</p>
        
        {product.tag && (
          <Badge variant="outline" className="mb-2">
            {product.tag}
          </Badge>
        )}
        
        <div className="text-xs text-gray-400 mt-2">
          Location: Aisle {product.aisleRow || product.aisle_row}, Column {product.aisleColumn || product.aisle_column}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="text-sm">
          {product.quantity > 0 ? (
            <span className="text-green-600">In Stock: {product.quantity}</span>
          ) : (
            <span className="text-red-500">Out of Stock</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
