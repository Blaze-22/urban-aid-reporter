export interface Issue {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image_urls?: string[];
  video_urls?: string[];
  upvotes: number;
  tracking_id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES = [
  'Road & Transportation',
  'Water & Sanitation',
  'Public Safety',
  'Parks & Recreation',
  'Utilities',
  'Waste Management',
  'Street Lighting',
  'Public Buildings',
  'Other'
] as const;

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'] as const;