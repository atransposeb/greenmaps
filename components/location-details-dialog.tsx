"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star, Phone, MapPin, Flame, ThumbsUp } from "lucide-react"
import type { Location, Review } from "@/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { VoteDialog } from "@/components/vote-dialog"

interface LocationDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location | null
}

export function LocationDetailsDialog({ open, onOpenChange, location }: LocationDetailsDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [newReview, setNewReview] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [loading, setLoading] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showVoteDialog, setShowVoteDialog] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (location && open) {
      fetchReviews()
      recordVisit()
    }
  }, [location, open])

  const fetchReviews = async () => {
    if (!location) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("location_id", location.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setReviews(data)
      }
    } catch (error) {
      console.log("Reviews table may not exist yet")
    }
    setLoading(false)
  }

  const recordVisit = async () => {
    if (!location || !user) return

    try {
      await supabase.from("visits").insert({
        location_id: location.id,
        user_id: user.id,
      })
    } catch (error) {
      console.log("Visits table may not exist yet")
    }
  }

  const submitReview = async () => {
    if (!location || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a review.",
        variant: "destructive",
      })
      return
    }

    if (!newReview.trim()) {
      toast({
        title: "Review required",
        description: "Please enter a review.",
        variant: "destructive",
      })
      return
    }

    setSubmittingReview(true)

    try {
      const { error } = await supabase.from("reviews").insert({
        location_id: location.id,
        user_id: user.id,
        rating: newRating,
        comment: newReview.trim(),
      })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to submit review. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Review submitted successfully!",
        })
        setNewReview("")
        setNewRating(5)
        fetchReviews()
      }
    } catch (error) {
      toast({
        title: "Info",
        description: "Reviews feature will be available once the database is fully set up.",
      })
    }

    setSubmittingReview(false)
  }

  const handleVoteSubmitted = async () => {
    setShowVoteDialog(false)

    // Refresh location data
    if (location) {
      try {
        const { data, error } = await supabase.from("locations").select("*").eq("id", location.id).single()

        if (!error && data) {
          // We can't directly update the location prop, but we can show a toast
          toast({
            title: "Vote Recorded",
            description: "Your vote has been recorded. Thank you for contributing!",
          })
        }
      } catch (error) {
        console.error("Error refreshing location data:", error)
      }
    }
  }

  if (!location) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            {location.name}
          </DialogTitle>
          {location.address && <DialogDescription>{location.address}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6">
          {/* Location Info */}
          <div className="space-y-4">
            {location.description && <p className="text-gray-700">{location.description}</p>}

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <Flame className={`h-4 w-4 ${location.igniter_score > 50 ? "text-orange-500" : "text-gray-500"}`} />
                <span className="font-medium">Igniter: {location.igniter_score}%</span>
                {location.total_votes > 0 && (
                  <span className="text-gray-500 text-sm">({location.total_votes} votes)</span>
                )}
              </div>

              <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => setShowVoteDialog(true)}>
                <ThumbsUp className="h-3 w-3 mr-1" />
                Vote
              </Button>

              {location.is_verified && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Verified
                </Badge>
              )}
            </div>

            {/* Ratings */}
            {location.average_rating && location.average_rating > 0 ? (
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{location.average_rating.toFixed(1)}</span>
                <span className="text-gray-500">({location.review_count} reviews)</span>
              </div>
            ) : (
              <Badge variant="outline" className="mt-2">
                No reviews yet
              </Badge>
            )}

            {/* Contact Info - Only Phone */}
            {location.contact_phone && (
              <div className="flex items-center gap-2 text-sm mt-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{location.contact_phone}</span>
              </div>
            )}
          </div>

          {/* Add Review */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leave a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setNewRating(star)} className="p-1">
                        <Star
                          className={`h-5 w-5 ${
                            star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                />
                <Button onClick={submitReview} disabled={submittingReview} className="w-full">
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reviews</h3>
            {loading ? (
              <p className="text-gray-500">Loading reviews...</p>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && <p className="text-gray-700">{review.comment}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>

        {/* Vote Dialog */}
        {location && (
          <VoteDialog
            open={showVoteDialog}
            onOpenChange={setShowVoteDialog}
            location={location}
            onVoteSubmitted={handleVoteSubmitted}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
