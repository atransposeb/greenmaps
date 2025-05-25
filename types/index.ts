export interface Location {
  id: string
  name: string
  description?: string
  address?: string
  latitude: number
  longitude: number
  contact_phone?: string
  contact_email?: string
  created_at: string
  is_verified?: boolean
  igniter_score: number
  igniter_votes: number
  imposter_votes: number
  total_votes: number
  // Other fields
  trust_score?: number
  review_count?: number
  average_rating?: number
}

export interface Vote {
  id: string
  location_id: string
  user_id: string
  vote_type: "igniter" | "imposter"
  created_at: string
}

export interface Review {
  id: string
  location_id: string
  user_id: string
  rating: number
  comment?: string
  created_at: string
  is_moderated: boolean
}

export interface Visit {
  id: string
  location_id: string
  user_id: string
  visited_at: string
}

export interface UserLocation {
  latitude: number
  longitude: number
}
