"use client"

import { useState, useEffect } from "react"
import type { User, AuthError } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) {
          console.error("Error getting session:", error)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { error }
      }

      console.log("Sign in successful:", data.user?.email)
      return { error: null }
    } catch (error) {
      console.error("Unexpected sign in error:", error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string): Promise<{ error: AuthError | null; user: User | null }> => {
    try {
      setLoading(true)
      // Sign up without email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Skip email confirmation
          emailRedirectTo: undefined,
          // Auto sign in after registration
          data: {
            email_confirmed: true,
          },
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        return { error, user: null }
      }

      // If sign-up is successful, immediately sign in the user
      if (data.user) {
        console.log("Sign up successful:", data.user.email)

        // The user should be automatically signed in by Supabase
        // but we'll check the session to be sure
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          // If for some reason they're not signed in, sign them in manually
          await signIn(email, password)
        }

        return { error: null, user: data.user }
      }

      return { error: null, user: null }
    } catch (error) {
      console.error("Unexpected sign up error:", error)
      return { error: error as AuthError, user: null }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        return { error }
      }
      return { error: null }
    } catch (error) {
      console.error("Unexpected sign out error:", error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
