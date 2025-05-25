"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Navigation, Flame, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Location, UserLocation } from "@/types"
import { calculateDistance, getCurrentLocation } from "@/lib/utils"
import { VoteDialog } from "@/components/vote-dialog"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface InteractiveMapProps {
  locations: Location[]
  userLocation: UserLocation | null
  onLocationSelect: (location: Location) => void
  onAddLocation: (lat: number, lng: number) => void
  onVoteSubmitted: () => void
  readOnly?: boolean
}

export function InteractiveMap({
  locations,
  userLocation,
  onLocationSelect,
  onAddLocation,
  onVoteSubmitted,
  readOnly = false,
}: InteractiveMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 })
  const [zoom, setZoom] = useState(12)
  const [showVoteDialog, setShowVoteDialog] = useState(false)
  const [locationToVote, setLocationToVote] = useState<Location | null>(null)

  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const userMarkerRef = useRef<L.Marker | null>(null)

  // Initialize map with dark theme
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([mapCenter.lat, mapCenter.lng], zoom)

      // Dark theme tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      if (!readOnly) {
        map.on("click", (e) => {
          onAddLocation(e.latlng.lat, e.latlng.lng)
        })
      }

      mapRef.current = map
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [readOnly])

  // Update map center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([mapCenter.lat, mapCenter.lng], zoom)
    }
  }, [mapCenter, zoom])

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    const userIcon = L.divIcon({
      className: "user-location-marker",
      html: `
        <div class="relative">
          <div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute inset-0 w-4 h-4 bg-green-500 rounded-full opacity-30 animate-ping"></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon }).addTo(
      mapRef.current,
    )

    if (!mapCenter.lat || !mapCenter.lng) {
      setMapCenter({ lat: userLocation.latitude, lng: userLocation.longitude })
    }
  }, [userLocation, mapRef.current])

  // Update location markers
  useEffect(() => {
    if (!mapRef.current) return

    Object.values(markersRef.current).forEach((marker) => marker.remove())
    markersRef.current = {}

    locations.forEach((location) => {
      const isHighlyTrusted = location.igniter_score > 80

      const cannabisIcon = L.divIcon({
        className: "cannabis-location-marker",
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            ${
              isHighlyTrusted
                ? `
                <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
              `
                : ""
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      const marker = L.marker([location.latitude, location.longitude], { icon: cannabisIcon })
        .addTo(mapRef.current!)
        .on("click", () => {
          setSelectedLocation(location)
          onLocationSelect(location)
        })

      markersRef.current[location.id] = marker
    })
  }, [locations, mapRef.current])

  const centerOnUser = async () => {
    const location = await getCurrentLocation()
    if (location) {
      setMapCenter({ lat: location.latitude, lng: location.longitude })
      setZoom(15)
    }
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          className="w-10 h-10 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={centerOnUser}
        >
          <Navigation className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            className="w-10 h-10 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => setZoom(Math.min(zoom + 1, 19))}
          >
            +
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-10 h-10 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => setZoom(Math.max(zoom - 1, 3))}
          >
            -
          </Button>
        </div>
      </div>

      {/* Add Location Button */}
      {!readOnly && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <Button className="bg-green-500 hover:bg-green-600 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
      )}

      {/* Selected Location Card */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 z-[1001] max-w-sm">
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    {selectedLocation.name}
                    {selectedLocation.is_verified && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
                    )}
                  </CardTitle>
                  {selectedLocation.address && (
                    <CardDescription className="text-gray-600">{selectedLocation.address}</CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setSelectedLocation(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {selectedLocation.description && <p className="text-sm text-gray-600">{selectedLocation.description}</p>}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">{selectedLocation.igniter_score}% Trusted</span>
                  {selectedLocation.total_votes > 0 && (
                    <span className="text-xs text-gray-500">({selectedLocation.total_votes} votes)</span>
                  )}
                </div>

                {!readOnly && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      setLocationToVote(selectedLocation)
                      setShowVoteDialog(true)
                    }}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Vote
                  </Button>
                )}
              </div>

              {userLocation && (
                <div className="text-xs text-gray-500">
                  {calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    selectedLocation.latitude,
                    selectedLocation.longitude,
                  ).toFixed(1)}{" "}
                  km away
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vote Dialog */}
      {locationToVote && !readOnly && (
        <VoteDialog
          open={showVoteDialog}
          onOpenChange={setShowVoteDialog}
          location={locationToVote}
          onVoteSubmitted={() => {
            setShowVoteDialog(false)
            setLocationToVote(null)
            onVoteSubmitted()
          }}
        />
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        .user-location-marker,
        .cannabis-location-marker {
          background: transparent;
          border: none;
        }
        .leaflet-control-attribution {
          background-color: rgba(255, 255, 255, 0.8);
          color: #374151;
        }
        .leaflet-control-attribution a {
          color: #059669;
        }
      `}</style>
    </div>
  )
}
