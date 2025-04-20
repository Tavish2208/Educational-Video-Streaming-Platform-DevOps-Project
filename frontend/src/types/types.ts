export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  url?: string;
  uploadDate?: string;
  duration?: string;
  views?: number;
  rating?: number;
}