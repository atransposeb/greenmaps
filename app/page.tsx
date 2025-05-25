"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Shield, TrendingUp, ArrowRight, Zap } from "lucide-react"
import { MapWrapper } from "@/components/map-wrapper"
import { AuthDialog } from "@/components/auth-dialog"
import { LocationDetailsDialog } from "@/components/location-details-dialog"
import type { Location, UserLocation } from "@/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { getCurrentLocation } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showLocationDetails, setShowLocationDetails] = useState(false)
  const [loading, setLoading] = useState(true)
  const [locationAccess, setLocationAccess] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("locations").select("*")
      if (error) throw error

      if (data) {
        const processedLocations = data.map((location) => ({
          ...location,
          igniter_score: location.igniter_score || 100,
          igniter_votes: location.igniter_votes || 0,
          imposter_votes: location.imposter_votes || 0,
          total_votes: location.total_votes || 0,
        }))
        setLocations(processedLocations)
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location)
    setShowLocationDetails(true)
  }

  const handleAllowLocation = async () => {
    try {
      const location = await getCurrentLocation()
      if (location) {
        setUserLocation(location)
        setLocationAccess(true)
        toast({
          title: "Location access granted",
          description: "Now showing cannabis locations near you",
        })
      }
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Please enable location access to see nearby spots.",
        variant: "destructive",
      })
    }
  }

  const stats = [
    { icon: MapPin, label: "Active Locations", value: locations.length.toString() },
    { icon: Users, label: "Community Members", value: "2.4K" },
    { icon: Shield, label: "Verified Spots", value: locations.filter((l) => l.is_verified).length.toString() },
    { icon: TrendingUp, label: "Growth Rate", value: "+127%" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {!locationAccess ? (
        <main className="flex-1 container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-4xl">🌿</span>
              <h1 className="text-4xl md:text-5xl font-bold text-white">Hello! Ready to explore cannabis locations?</h1>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Card - Main CTA */}
            <Card className="bg-background-card border-gray-800 p-8">
              <CardContent className="p-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Discover your local cannabis community.</h2>
                    <p className="text-text-secondary text-lg leading-relaxed">
                      With GreenMap's community platform, you've got everything you need to find and share the best
                      cannabis locations in your area.
                    </p>
                  </div>

                  <Button
                    onClick={handleAllowLocation}
                    className="w-full bg-transparent border border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500 transition-colors rounded-lg py-3"
                  >
                    GET ACCESS TO LOCATIONS
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Side - Stats and Visual Elements */}
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <Card key={stat.label} className="bg-background-card border-gray-800 p-4">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <stat.icon className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">{stat.value}</div>
                          <div className="text-sm text-text-secondary">{stat.label}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Feature Highlight */}
              <Card className="bg-green-500/5 border-green-500/20 p-6">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-green-500 text-white">Community First</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Built by cannabis enthusiasts</h3>
                  <p className="text-text-secondary text-sm">
                    Our platform is designed with the cannabis community in mind, featuring user reviews, location
                    verification, and community-driven content.
                  </p>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-800 justify-start"
                  onClick={() => setShowAuthDialog(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Join Community
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-800 justify-start"
                  onClick={() => (window.location.href = "/add")}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center gap-2 text-text-secondary">
              <Zap className="h-4 w-4" />
              <span>Join thousands of cannabis enthusiasts discovering new spots</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1">
          <div className="h-[calc(100vh-3.5rem)]">
            <MapWrapper
              locations={locations}
              userLocation={userLocation}
              onLocationSelect={handleLocationSelect}
              loading={loading}
              readOnly={true}
            />
          </div>
        </main>
      )}

      {/* Dialogs */}
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      <LocationDetailsDialog
        open={showLocationDetails}
        onOpenChange={setShowLocationDetails}
        location={selectedLocation}
      />
    </div>
  )
}
