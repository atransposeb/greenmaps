"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Flame, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import type { Location } from "@/types"

interface VoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location
  onVoteSubmitted: () => void
}

export function VoteDialog({ open, onOpenChange, location, onVoteSubmitted }: VoteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedVote, setSelectedVote] = useState<"igniter" | "imposter" | null>(null)

  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const handleVote = async (voteType: "igniter" | "imposter") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    setSelectedVote(voteType)

    try {
      // Check if user has already voted for this location
      const { data: existingVote, error: checkError } = await supabase
        .from("votes")
        .select("*")
        .eq("location_id", location.id)
        .eq("user_id", user.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // Error other than "no rows returned"
        throw checkError
      }

      let result

      if (existingVote) {
        // Update existing vote
        result = await supabase.from("votes").update({ vote_type: voteType }).eq("id", existingVote.id)
      } else {
        // Insert new vote
        result = await supabase.from("votes").insert({
          location_id: location.id,
          user_id: user.id,
          vote_type: voteType,
        })
      }

      if (result.error) {
        throw result.error
      }

      // Update location vote counts
      await updateLocationVoteCounts(location.id)

      setSuccess(true)
      toast({
        title: "Vote submitted",
        description: `You voted this location as ${voteType === "igniter" ? "an Igniter" : "an Imposter"}.`,
      })

      // Wait a moment before closing
      setTimeout(() => {
        onVoteSubmitted()
        onOpenChange(false)
      }, 1500)
    } catch (err: any) {
      console.error("Error submitting vote:", err)
      setError(`Failed to submit vote: ${err.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateLocationVoteCounts = async (locationId: string) => {
    try {
      // Get vote counts
      const { data: votes, error: countError } = await supabase
        .from("votes")
        .select("vote_type")
        .eq("location_id", locationId)

      if (countError) throw countError

      const igniterVotes = votes?.filter((v) => v.vote_type === "igniter").length || 0
      const imposterVotes = votes?.filter((v) => v.vote_type === "imposter").length || 0
      const totalVotes = votes?.length || 0

      // Calculate igniter score (percentage of igniter votes)
      const igniterScore = totalVotes > 0 ? Math.round((igniterVotes / totalVotes) * 100) : 100 // Default to 100 if no votes

      // Update location with new counts
      const { error: updateError } = await supabase
        .from("locations")
        .update({
          igniter_votes: igniterVotes,
          imposter_votes: imposterVotes,
          total_votes: totalVotes,
          igniter_score: igniterScore,
        })
        .eq("id", locationId)

      if (updateError) throw updateError
    } catch (err) {
      console.error("Error updating location vote counts:", err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !loading && onOpenChange(newOpen)}>
      <DialogContent className="sm:max-w-[425px] bg-charcoal border-charcoal text-white">
        <DialogHeader>
          <DialogTitle>Vote for {location.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Is this location legit or suspicious? Your vote helps the community.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-lime mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Vote Submitted!</h3>
            <p className="text-gray-400">
              You voted this location as {selectedVote === "igniter" ? "an Igniter" : "an Imposter"}.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive" className="bg-red-900 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-4">
              <div className="text-sm text-gray-400 mb-2">
                Current Igniter Score: <span className="font-semibold text-white">{location.igniter_score}%</span>
                {location.total_votes > 0 && <span className="text-xs ml-2">({location.total_votes} votes)</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleVote("igniter")}
                  disabled={loading}
                  className="flex flex-col items-center justify-center py-6 bg-green hover:bg-green-dark text-white"
                >
                  <Flame className="h-8 w-8 mb-2 text-lime" />
                  <span className="font-medium">Igniter</span>
                  <span className="text-xs mt-1">This location is legit</span>
                </Button>

                <Button
                  onClick={() => handleVote("imposter")}
                  disabled={loading}
                  variant="outline"
                  className="flex flex-col items-center justify-center py-6 border-charcoal bg-black hover:bg-charcoal"
                >
                  <AlertTriangle className="h-8 w-8 mb-2 text-red-500" />
                  <span className="font-medium text-red-500">Imposter</span>
                  <span className="text-xs mt-1 text-gray-400">This location is suspicious</span>
                </Button>
              </div>

              {loading && <div className="text-center text-sm text-gray-400 mt-2">Submitting your vote...</div>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
