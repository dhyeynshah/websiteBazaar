import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function ProductFilters({ 
  filters, 
  selectedFilters, 
  onFilterChange,
  onClearFilters
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">Filters</h2>
        {selectedFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear all
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Badge
            key={filter}
            variant={selectedFilters.includes(filter) ? "default" : "outline"}
            className="cursor-pointer text-sm py-1 px-3"
            onClick={() => onFilterChange(filter)}
          >
            {filter}
            {selectedFilters.includes(filter) && (
              <X className="ml-1 h-3 w-3" />
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}
