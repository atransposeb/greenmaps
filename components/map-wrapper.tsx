"use client"

import { useState, useEffect } from "react"
import { Leaf } from "lucide-react"
import dynamic from "next/dynamic"
import type { Location, UserLocation } from "@/types"

// Dynamically import the map component with no SSR
const InteractiveMapWithNoSSR = dynamic(() => import("./interactive-map").then((mod) => mod.InteractiveMap), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Leaf className="h-8 w-8 text-lime mx-auto mb-4 animate-pulse" />
        <p className="text-white">Loading map...</p>
      </div>
    </div>
  ),
})

interface MapWrapperProps {
  locations: Location[]
  userLocation: UserLocation | null
  onLocationSelect: (location: Location) => void
  onAddLocation?: (lat: number, lng: number) => void
  onVoteSubmitted?: () => void
  loading: boolean
  readOnly?: boolean
}

export function MapWrapper({
  locations,
  userLocation,
  onLocationSelect,
  onAddLocation,
  onVoteSubmitted,
  loading,
  readOnly = false,
}: MapWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-8 w-8 text-lime mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <InteractiveMapWithNoSSR
      locations={locations}
      userLocation={userLocation}
      onLocationSelect={onLocationSelect}
      onAddLocation={onAddLocation || (() => {})}
      onVoteSubmitted={onVoteSubmitted || (() => {})}
      readOnly={readOnly}
    />
  )
}
