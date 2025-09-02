import { Issue } from '@/types/issue';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface MapViewProps {
  issues: Issue[];
  onLocationSelect?: (lat: number, lng: number) => void;
  clickable?: boolean;
}

export function MapView({ issues, onLocationSelect, clickable = false }: MapViewProps) {
  const handleLocationClick = () => {
    if (clickable && onLocationSelect) {
      // Default location for demo purposes
      onLocationSelect(40.7128, -74.0060);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'bg-green-600';
      case 'in progress': return 'bg-blue-600';
      case 'rejected': return 'bg-red-600';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="w-full h-[400px] rounded-lg border bg-muted/20 relative">
      {/* Map Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Interactive Map View</p>
          {clickable && (
            <button 
              onClick={handleLocationClick}
              className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded"
            >
              Click to select location
            </button>
          )}
        </div>
      </div>

      {/* Issues List Overlay */}
      {issues.length > 0 && (
        <div className="absolute top-4 right-4 max-w-xs max-h-80 overflow-y-auto space-y-2">
          {issues.slice(0, 3).map((issue) => (
            <Card key={issue.id} className="bg-background/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-1">{issue.title}</h4>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {issue.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                  <Badge className={`text-xs text-white ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </Badge>
                  <Badge className={`text-xs text-white ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {issues.length > 3 && (
            <div className="text-xs text-center text-muted-foreground bg-background/80 rounded p-2">
              +{issues.length - 3} more issues
            </div>
          )}
        </div>
      )}
    </div>
  );
}