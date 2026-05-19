"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client" // Use singleton client instead of createClient
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Mail, CheckCircle, Sparkles } from "lucide-react"

interface Photo {
  id: string
  title: string
  description: string
  image_url: string
  storage_path: string
  is_active: boolean
  created_at: string
}

export function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      console.log("[v0] Starting to load photos...")
      const supabase = getSupabaseClient() // Use singleton client instead of createClient()

      if (!supabase) {
        console.error("[v0] Failed to get Supabase client")
        setError("Failed to connect to database. Please check your connection.")
        return
      }

      console.log("[v0] Supabase client retrieved successfully")

      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading photos:", error)
        setError(`Failed to load photos: ${error.message}`)
      } else {
        console.log("[v0] Photos loaded successfully:", data?.length || 0, "photos")
        setPhotos(data || [])
        setError(null)
      }
    } catch (err) {
      console.error("[v0] Unexpected error loading photos:", err)
      setError("Failed to connect to database. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  const handleContinueWithSelection = () => {
    setShowEmailForm(true)
  }

  const submitSelection = async () => {
    if (!customerEmail || selectedPhotos.size === 0) return

    setSubmitting(true)

    try {
      console.log("[v0] Submitting customer selection...")
      const supabase = getSupabaseClient() // Use singleton client instead of createClient()

      if (!supabase) {
        console.error("[v0] Failed to get Supabase client for submission")
        alert("Failed to connect to database. Please try again.")
        return
      }

      const selectionData = {
        customer_email: customerEmail,
        customer_name: customerName || null,
        notes: notes || null,
        selected_photos: Array.from(selectedPhotos),
      }

      const { error } = await supabase.from("customer_selections").insert([selectionData])

      if (error) {
        console.error("[v0] Error submitting selections:", error)
        alert("Failed to submit selections. Please try again.")
        return
      }

      console.log("[v0] Selection submitted successfully")

      try {
        await fetch("/api/send-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerEmail,
            customerName,
            photoIds: Array.from(selectedPhotos),
            notes,
          }),
        })
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
      }

      setSubmitted(true)
      setTimeout(() => {
        setSelectedPhotos(new Set())
        setShowEmailForm(false)
        setCustomerEmail("")
        setCustomerName("")
        setNotes("")
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error("[v0] Submission error:", error)
      alert("Failed to submit selections. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 rounded-t-lg animate-pulse"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded mb-2 animate-pulse"></div>
              <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-2/3 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-red-50 to-pink-50 border-red-200 shadow-lg">
        <h2 className="text-xl font-bold text-red-800 mb-2">Connection Error</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={loadPhotos} variant="outline" className="hover:bg-red-50 transition-colors bg-transparent">
          Try Again
        </Button>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200 shadow-xl">
        <div className="relative">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4 animate-bounce" />
          <Sparkles className="h-6 w-6 text-yellow-500 absolute top-0 right-1/3 animate-pulse" />
          <Sparkles className="h-4 w-4 text-pink-500 absolute bottom-2 left-1/3 animate-pulse delay-300" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Thank You!
        </h2>
        <p className="text-green-700 text-lg">
          Your photo selections have been submitted successfully. We'll be in touch soon!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {selectedPhotos.size > 0 && !showEmailForm && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-purple-200 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500 animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {selectedPhotos.size} photo{selectedPhotos.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleContinueWithSelection}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Continue with Selection
            </Button>
          </div>
        </Card>
      )}

      {showEmailForm && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-xl animate-in slide-in-from-bottom duration-500">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              <Mail className="h-5 w-5 text-blue-600" />
              Complete Your Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-sm text-blue-700 mb-4 p-3 bg-white/50 rounded-lg border border-blue-100">
                ✨ You've selected {selectedPhotos.size} photo{selectedPhotos.size > 1 ? "s" : ""}. Please provide your
                contact information so we can get in touch with you.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-email">Email Address *</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="your@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer-name">Name (Optional)</Label>
                  <Input
                    id="customer-name"
                    type="text"
                    placeholder="Your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={submitSelection}
                  disabled={!customerEmail || submitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Selection"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEmailForm(false)}
                  disabled={submitting}
                  className="hover:bg-purple-50 transition-colors"
                >
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo, index) => (
          <Card
            key={photo.id}
            className="group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-in fade-in slide-in-from-bottom"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative overflow-hidden">
              <img
                src={photo.image_url || "/placeholder.svg?height=256&width=384&query=photo placeholder"}
                alt={photo.title}
                className="w-full h-64 object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Button
                variant={selectedPhotos.has(photo.id) ? "default" : "secondary"}
                size="sm"
                className={`absolute top-3 right-3 transition-all duration-300 transform ${
                  selectedPhotos.has(photo.id)
                    ? "opacity-100 scale-110 bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg"
                    : "opacity-0 group-hover:opacity-100 hover:scale-110 bg-white/90 backdrop-blur-sm"
                }`}
                onClick={() => togglePhotoSelection(photo.id)}
                disabled={showEmailForm}
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-300 ${
                    selectedPhotos.has(photo.id) ? "fill-current animate-pulse" : ""
                  }`}
                />
              </Button>
              {selectedPhotos.has(photo.id) && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-in slide-in-from-left">
                  Selected
                </div>
              )}
            </div>
            <CardContent className="p-4 bg-gradient-to-br from-white to-gray-50">
              <h3 className="font-semibold mb-1 text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                {photo.title}
              </h3>
              {photo.description && (
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  {photo.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {photos.length === 0 && !error && (
        <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-blue-50 shadow-lg">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-600 text-lg">No photos available yet.</p>
          <p className="text-gray-500 text-sm mt-2">Check back soon for new additions!</p>
        </Card>
      )}
    </div>
  )
}
