import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Issue } from '@/types/issue';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  issues: Issue[];
  onLocationSelect?: (lat: number, lng: number) => void;
  clickable?: boolean;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  
  const map = useMapEvents({
    click(e) {
      if (onLocationSelect) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected location</Popup>
    </Marker>
  );
}

export function MapView({ issues, onLocationSelect, clickable = false }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

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
    <div className="w-full h-[400px] rounded-lg overflow-hidden border">
      <MapContainer 
        key={`${userLocation[0]}-${userLocation[1]}`}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {clickable && <LocationMarker onLocationSelect={onLocationSelect} />}
        
        {issues.map((issue) => (
          issue.latitude && issue.longitude && (
            <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
              <Popup>
                <Card className="border-0 shadow-none">
                  <CardContent className="p-3">
                    <h3 className="font-semibold mb-2">{issue.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                      <Badge className={`text-xs text-white ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </Badge>
                      <Badge className={`text-xs text-white ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">ID: {issue.tracking_id}</p>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}