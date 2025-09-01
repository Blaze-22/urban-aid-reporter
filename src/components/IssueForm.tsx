import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapView } from './MapView';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES, PRIORITIES } from '@/types/issue';
import { useToast } from '@/hooks/use-toast';
import { Upload, Camera, MapPin, X } from 'lucide-react';

interface IssueFormProps {
  onSubmit?: () => void;
}

export function IssueForm({ onSubmit }: IssueFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    location: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    
    // Reverse geocoding to get address (simplified)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        setFormData(prev => ({
          ...prev,
          address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));
      })
      .catch(() => {
        setFormData(prev => ({
          ...prev,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));
      });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return (isImage || isVideo) && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only images and videos under 10MB are allowed.",
        variant: "destructive",
      });
    }
    
    setMediaFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('issue-media')
        .upload(fileName, file);
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('issue-media')
        .getPublicUrl(fileName);
        
      return publicUrl;
    });
    
    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        mediaUrls = await uploadMedia(mediaFiles);
      }
      
      const imageUrls = mediaUrls.filter(url => {
        const ext = url.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
      });
      
      const videoUrls = mediaUrls.filter(url => {
        const ext = url.split('.').pop()?.toLowerCase();
        return ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '');
      });
      
      const { data, error } = await supabase
        .from('issues')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          location: formData.location,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          image_urls: imageUrls,
          video_urls: videoUrls,
          status: 'Pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Issue submitted successfully!",
        description: `Tracking ID: ${data.tracking_id}`,
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        location: '',
        address: '',
        latitude: null,
        longitude: null,
      });
      setMediaFiles([]);
      
      onSubmit?.();
    } catch (error: any) {
      toast({
        title: "Error submitting issue",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Report a Civic Issue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed information about the issue"
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="location">Location Description</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Near City Hall, Main Street intersection"
            />
          </div>
          
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Select Location on Map (Click to pin)
            </Label>
            <MapView 
              issues={[]} 
              onLocationSelect={handleLocationSelect}
              clickable={true}
            />
            {formData.address && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {formData.address}
              </p>
            )}
          </div>
          
          <div>
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Photos/Videos (Optional)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-2"
            >
              Choose Files (Max 5, 10MB each)
            </Button>
            
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-muted rounded border flex items-center justify-center text-xs p-2 text-center">
                      {file.type.startsWith('image/') ? '🖼️' : '🎥'} {file.name}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.title || !formData.description || !formData.category}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Issue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}