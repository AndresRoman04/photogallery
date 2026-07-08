"use client"

import { useState, useEffect } from "react"
import { getGalleryPhotosAction, submitSelectionAction } from "@/app/actions/photos"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Mail, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Photo {
  id: string
  title: string
  description: string | null
  imageUrl: string
  storagePath: string
  isActive: boolean
  createdAt: Date
}

// Renders one photographer's public gallery, identified by their URL slug
// (resolved to a photographer by app/gallery/[slug]/page.tsx).
export function PhotoGallery({ slug }: { slug: string }) {
  const PAGE_SIZE = 12
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
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
    loadPhotos(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const loadPhotos = async (page: number) => {
    try {
      setLoading(true)
      const result = await getGalleryPhotosAction(slug, page, PAGE_SIZE)

      if (result.success && result.photos) {
        setPhotos(result.photos)
        setCurrentPage(page)
        setTotalPages(Math.ceil((result.total ?? 0) / PAGE_SIZE))
        setError(null)
      } else {
        console.error("Error loading photos:", result.error)
        setError("Failed to load photos. Please try again.")
      }
    } catch (err) {
      console.error("Unexpected error loading photos:", err)
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
      const result = await submitSelectionAction({
        customerEmail,
        customerName: customerName || null,
        notes: notes || null,
        selectedPhotos: Array.from(selectedPhotos),
      })

      if (!result.success) {
        console.error("Error submitting selections:", result.error)
        toast.error("Failed to submit selections. Please try again.")
        return
      }

      toast.success("Selections submitted successfully!")
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
      console.error("Submission error:", error)
      toast.error("Failed to submit selections. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border border-muted bg-card shadow-md">
            <div className="relative aspect-[4/3] bg-muted shimmer-gradient">
              <div className="absolute top-3 right-3 w-8 h-8 rounded bg-background/50 backdrop-blur-sm animate-pulse"></div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="h-5 bg-muted shimmer-gradient rounded w-3/4"></div>
              <div className="h-4 bg-muted shimmer-gradient rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Connection Error</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => loadPhotos(currentPage)} variant="outline">
          Try Again
        </Button>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
        <h2 className="text-3xl font-light tracking-tight mb-2">Thank You!</h2>
        <p className="text-muted-foreground text-lg">
          Your photo selections have been submitted successfully. We'll be in touch soon!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {selectedPhotos.size > 0 && !showEmailForm && (
        <Card className="p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {selectedPhotos.size} photo{selectedPhotos.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <Button size="sm" onClick={handleContinueWithSelection}>
              Continue with Selection
            </Button>
          </div>
        </Card>
      )}

      {showEmailForm && (
        <Card className="p-6 animate-in slide-in-from-bottom duration-500">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Complete Your Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-lg border border-border">
                You've selected {selectedPhotos.size} photo{selectedPhotos.size > 1 ? "s" : ""}. Please provide your
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
                  className="flex-1"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
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
            className="group overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={photo.imageUrl || "/placeholder.svg"}
                alt={photo.title}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Button
                variant={selectedPhotos.has(photo.id) ? "default" : "secondary"}
                size="sm"
                className={`absolute top-3 right-3 transition-all duration-300 transform ${
                  selectedPhotos.has(photo.id)
                    ? "opacity-100 scale-110 bg-primary text-primary-foreground shadow-lg"
                    : "opacity-0 group-hover:opacity-100 hover:scale-110 bg-background/90 backdrop-blur-sm"
                }`}
                onClick={() => togglePhotoSelection(photo.id)}
                disabled={showEmailForm}
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-300 ${
                    selectedPhotos.has(photo.id) ? "fill-current" : ""
                  }`}
                />
              </Button>
              {selectedPhotos.has(photo.id) && (
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium animate-in slide-in-from-left">
                  Selected
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-1 text-card-foreground group-hover:text-primary transition-colors duration-300">
                {photo.title}
              </h3>
              {photo.description && (
                <p className="text-sm text-muted-foreground">
                  {photo.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (currentPage > 1) loadPhotos(currentPage - 1) }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const nearCurrent = Math.abs(p - currentPage) <= 1
              const isEdge = p === 1 || p === totalPages
              if (!nearCurrent && !isEdge) {
                if (p === 2 || p === totalPages - 1) {
                  return <PaginationItem key={p}><PaginationEllipsis /></PaginationItem>
                }
                return null
              }
              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === currentPage}
                    onClick={(e) => { e.preventDefault(); loadPhotos(p) }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) loadPhotos(currentPage + 1) }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {photos.length === 0 && !error && (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-foreground text-lg">No photos available yet.</p>
          <p className="text-muted-foreground text-sm mt-2">Check back soon for new additions!</p>
        </Card>
      )}
    </div>
  )
}
