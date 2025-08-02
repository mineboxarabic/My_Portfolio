import { Button } from "@/components/ui/button";
import { Grid3X3, List, LayoutGrid } from "lucide-react";

interface BlogViewToggleProps {
  currentView: 'grid' | 'list' | 'cards';
  onViewChange: (view: 'grid' | 'list' | 'cards') => void;
}

const BlogViewToggle = ({ currentView, onViewChange }: BlogViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="h-8 w-8 p-0"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={currentView === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className="h-8 w-8 p-0"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default BlogViewToggle;