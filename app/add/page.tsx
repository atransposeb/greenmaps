"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, MapPin, ArrowLeft } from "lucide-react"
import { MapWrapper } from "@/components/map-wrapper"
import { AuthDialog } from "@/components/auth-dialog"
import type { UserLocation } from "@/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { getCurrentLocation } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AddLocationPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)

  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    getUserLocation()
  }, [])

  useEffect(() => {
    if (!user) {
      setShowAuthDialog(true)
    }
  }, [user])

  const getUserLocation = async () => {
    try {
      const location = await getCurrentLocation()
      if (location) {
        setUserLocation(location)
        if (!selectedCoords) {
          setSelectedCoords({ lat: location.latitude, lng: location.longitude })
        }
      }
    } catch (error) {
      console.error("Error getting user location:", error)
    } finally {
      setMapLoading(false)
    }
  }

  const handleAddLocation = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng })
  }

  const handleSubmit = async () => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    if (!name.trim()) {
      setError("Please enter a name for the location.")
      return
    }

    if (!selectedCoords) {
      setError("Please select a location on the map.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newLocation = {
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        contact_phone: contactPhone.trim() || null,
        igniter_score: 100,
        igniter_votes: 0,
        imposter_votes: 0,
        total_votes: 0,
      }

      const { data, error: insertError } = await supabase.from("locations").insert(newLocation).select()

      if (insertError) {
        console.error("Error adding location:", insertError)
        setError(`Failed to add location: ${insertError.message}`)
      } else {
        console.log("Location added successfully:", data)
        setSuccess(true)
        toast({
          title: "Success",
          description: "Location added successfully!",
        })

        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (err) {
      console.error("Unexpected error adding location:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-text-secondary hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to map
          </Link>
          <h1 className="text-3xl font-bold text-white">Add a new cannabis location</h1>
          <p className="text-text-secondary mt-2">Share a great spot with the community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
          {/* Map Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Select location on map</h2>
              <p className="text-text-secondary text-sm">Click on the map to choose the exact location</p>
            </div>

            <Card className="bg-background-card border-gray-800 h-[500px] overflow-hidden">
              <CardContent className="p-0 h-full">
                <MapWrapper
                  locations={[]}
                  userLocation={userLocation}
                  onLocationSelect={() => {}}
                  onAddLocation={handleAddLocation}
                  loading={mapLoading}
                  readOnly={false}
                />
              </CardContent>
            </Card>

            {selectedCoords && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Location selected</span>
                </div>
                <p className="text-xs text-text-secondary">
                  {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            {success ? (
              <Card className="bg-background-card border-gray-800">
                <CardContent className="p-8 text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Location added successfully!</h3>
                    <p className="text-text-secondary">Your location is now visible on the community map.</p>
                  </div>
                  <Button onClick={() => router.push("/")} className="bg-green-500 hover:bg-green-600 text-white">
                    View on map
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-background-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Location details</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Provide information about this cannabis location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter location name"
                      className="bg-background-muted border-gray-700 text-white focus:border-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-white">
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter address"
                      className="bg-background-muted border-gray-700 text-white focus:border-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this location..."
                      rows={3}
                      className="bg-background-muted border-gray-700 text-white focus:border-green-500 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">
                      Phone (Optional)
                    </Label>
                    <Input
                      id="phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Phone number"
                      className="bg-background-muted border-gray-700 text-white focus:border-green-500"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !selectedCoords}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    {loading ? "Adding location..." : "Add location"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={(open) => {
          setShowAuthDialog(open)
          if (!open && !user) {
            router.push("/")
          }
        }}
      />
    </div>
  )
}
