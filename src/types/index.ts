export interface Project {
  id: string; title: string; slug: string; description: string; features: string[];
  category: string; technologies: string[]; cover_image: string | null; gallery: string[];
  external_url: string | null; status: 'draft' | 'published'; display_order: number;
  created_at: string; updated_at: string;
}
export interface Service {
  id: string; title: string; slug: string; description: string; capabilities: string[];
  category: string; icon: string | null; is_active: boolean; display_order: number;
}
export type ModerationStatus = 'pending' | 'published' | 'rejected' | 'hidden' | 'flagged';
export interface Review {
  id: string; rating: number; comment: string; public_name: string; project_id: string | null;
  verification_status: 'unverified' | 'verified'; moderation_status: ModerationStatus;
  created_at: string; published_at: string | null;
}
export interface ReviewStats { count: number; average: number; distribution: Record<'1' | '2' | '3' | '4' | '5', number>; }
export type QuoteStatus = 'new' | 'in_review' | 'replied' | 'accepted' | 'declined' | 'done' | 'archived';
export interface QuoteRequest {
  id: string; reference: string; name: string; email: string; service_category: string;
  project_title: string; description: string; budget_range: string | null; desired_deadline: string | null;
  reference_links: string[]; status: QuoteStatus; internal_notes: string; notified_at: string | null;
  created_at: string; updated_at: string;
}
export interface QuoteEvent { id: string; quote_id: string; kind: 'note' | 'email_in' | 'email_out' | 'status'; body: string; created_at: string; }
export interface ContactMessage { id: string; name: string; email: string; message: string; is_read: boolean; created_at: string; }
export type Settings = Record<string, string>;
