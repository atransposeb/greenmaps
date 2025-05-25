"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("signin")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const { user, signIn, signUp } = useAuth()
  const { toast } = useToast()

  // Close dialog if user becomes authenticated
  useEffect(() => {
    if (user && open) {
      onOpenChange(false)
      resetForm()
    }
  }, [user, open, onOpenChange])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const validateForm = (isSignUp = false) => {
    const newErrors: { [key: string]: string } = {}

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (!validatePassword(password)) {
      newErrors.password = "Password must be at least 6 characters long"
    }

    if (isSignUp) {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignIn = async () => {
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      const { error } = await signIn(email, password)

      if (error) {
        let errorMessage = "Failed to sign in. Please try again."

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials."
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many sign-in attempts. Please wait a moment and try again."
        }

        toast({
          title: "Sign In Failed",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        })
        // Dialog will close automatically via the useEffect
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!validateForm(true)) return

    setLoading(true)
    setErrors({})

    try {
      const { error, user: newUser } = await signUp(email, password)

      if (error) {
        let errorMessage = "Failed to create account. Please try again."

        if (error.message.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please sign in instead."
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Password should be at least 6 characters long."
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address."
        }

        toast({
          title: "Sign Up Failed",
          description: errorMessage,
          variant: "destructive",
        })
      } else if (newUser) {
        toast({
          title: "Account Created!",
          description: "Your account has been created and you are now signed in.",
        })
        // Dialog will close automatically via the useEffect
      } else {
        toast({
          title: "Sign Up Successful",
          description: "Your account has been created. Please sign in.",
        })
        setActiveTab("signin")
        setPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setErrors({})
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-charcoal border-charcoal text-white">
        <DialogHeader>
          <DialogTitle>Welcome to GreenMaps</DialogTitle>
          <DialogDescription className="text-gray-400">
            Sign in to your account or create a new one to start discovering and sharing cannabis locations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black">
            <TabsTrigger value="signin" className="data-[state=active]:bg-green data-[state=active]:text-white">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-green data-[state=active]:text-white">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`bg-black border-charcoal text-white ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`bg-black border-charcoal text-white pr-10 ${errors.password ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-white hover:text-lime"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </div>
              )}
            </div>

            <Button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-green hover:bg-green-dark text-white"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`bg-black border-charcoal text-white ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className={`bg-black border-charcoal text-white pr-10 ${errors.password ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-white hover:text-lime"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`bg-black border-charcoal text-white pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-white hover:text-lime"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <Button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-green hover:bg-green-dark text-white"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
