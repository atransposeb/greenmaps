"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface AddLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  latitude: number
  longitude: number
  onLocationAdded: () => void
}

export function AddLocationDialog({
  open,
  onOpenChange,
  latitude,
  longitude,
  onLocationAdded,
}: AddLocationDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const resetForm = () => {
    setName("")
    setDescription("")
    setAddress("")
    setContactPhone("")
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add a location.",
        variant: "destructive",
      })
      return
    }

    if (!name.trim()) {
      setError("Please enter a name for the location.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create location object with only the fields that exist in the database
      const newLocation = {
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        latitude,
        longitude,
        contact_phone: contactPhone.trim() || null,
        // Removed created_by field since it doesn't exist in the database
      }

      console.log("Submitting location:", newLocation)

      const { data, error: insertError } = await supabase.from("locations").insert(newLocation).select()

      if (insertError) {
        console.error("Error adding location:", insertError)
        setError(`Failed to add location: ${insertError.message}`)
        toast({
          title: "Error",
          description: "Failed to add location. Please try again.",
          variant: "destructive",
        })
      } else {
        console.log("Location added successfully:", data)
        setSuccess(true)
        toast({
          title: "Success",
          description: "Location added successfully!",
        })

        // Wait a moment before closing the dialog to show success state
        setTimeout(() => {
          onLocationAdded() // Refresh the locations list
          onOpenChange(false) // Close the dialog
          resetForm() // Reset the form for next use
        }, 1500)
      }
    } catch (err) {
      console.error("Unexpected error adding location:", err)
      setError("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && !loading) {
          onOpenChange(newOpen)
          resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogDescription>
            Share a new cannabis location with the community. All submissions are subject to moderation.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Location Added Successfully!</h3>
            <p className="text-gray-500">Your location has been added to the map.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter location name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this location..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div className="text-sm text-gray-500">
              <p>
                Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Adding..." : "Add Location"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
