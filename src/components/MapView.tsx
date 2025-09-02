import { Issue } from '@/types/issue';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  issues: Issue[];
  onLocationSelect?: (lat: number, lng: number) => void;
  clickable?: boolean;
}

export function MapView({ issues, onLocationSelect, clickable = false }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  // Parul University, Waghodia coordinates
  const defaultCenter: [number, number] = [22.3511, 73.3717];

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return '#16a34a';
      case 'in progress': return '#2563eb';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Fix default icon issue with Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: defaultCenter,
      zoom: 13,
      scrollWheelZoom: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map.current);

    // Create markers layer
    markersLayer.current = L.layerGroup().addTo(map.current);

    // Add click handler for location selection
    if (clickable && onLocationSelect) {
      map.current.on('click', (e) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [clickable, onLocationSelect]);

  // Update markers when issues change
  useEffect(() => {
    if (!markersLayer.current) return;

    // Clear existing markers
    markersLayer.current.clearLayers();

    // Add markers for issues with coordinates
    issues.forEach((issue) => {
      if (issue.latitude && issue.longitude) {
        const marker = L.marker([issue.latitude, issue.longitude])
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm mb-1">${issue.title}</h3>
              <p class="text-xs text-gray-600 mb-2">${issue.description}</p>
              <div class="flex flex-wrap gap-1">
                <span class="px-2 py-1 text-xs rounded" style="background-color: ${getPriorityColor(issue.priority)}; color: white;">
                  ${issue.priority}
                </span>
                <span class="px-2 py-1 text-xs rounded" style="background-color: ${getStatusColor(issue.status)}; color: white;">
                  ${issue.status}
                </span>
              </div>
            </div>
          `);
        
        markersLayer.current?.addLayer(marker);
      }
    });
  }, [issues]);

  return (
    <div className="w-full h-[400px] rounded-lg border bg-muted/20 relative overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Issues List Overlay */}
      {issues.length > 0 && (
        <div className="absolute top-4 right-4 max-w-xs max-h-80 overflow-y-auto space-y-2 z-[1000]">
          {issues.slice(0, 3).map((issue) => (
            <Card key={issue.id} className="bg-background/90 backdrop-blur-sm shadow-lg">
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm mb-1">{issue.title}</h4>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {issue.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                  <Badge 
                    className="text-xs text-white" 
                    style={{ backgroundColor: getPriorityColor(issue.priority) }}
                  >
                    {issue.priority}
                  </Badge>
                  <Badge 
                    className="text-xs text-white" 
                    style={{ backgroundColor: getStatusColor(issue.status) }}
                  >
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
      
      {clickable && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm rounded p-2">
          <p className="text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 inline mr-1" />
            Click on map to select location
          </p>
        </div>
      )}
    </div>
  );
}