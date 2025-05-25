import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserLocation } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

export function calculateTrustScore(reviewCount: number, averageRating: number, visitCount: number): number {
  // Trust score algorithm: weighted combination of reviews, ratings, and visits
  const reviewWeight = 0.4
  const ratingWeight = 0.4
  const visitWeight = 0.2

  const normalizedReviews = Math.min(reviewCount / 10, 1) // Cap at 10 reviews for full score
  const normalizedRating = averageRating / 5 // Convert to 0-1 scale
  const normalizedVisits = Math.min(visitCount / 50, 1) // Cap at 50 visits for full score

  return (normalizedReviews * reviewWeight + normalizedRating * ratingWeight + normalizedVisits * visitWeight) * 100
}

export async function getCurrentLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    )
  })
}
