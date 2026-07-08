"use client"

import { useState, useEffect } from "react"
import { getSelectionsAction } from "@/app/actions/photos"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Calendar, User, MessageSquare, Inbox } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface GroupedSelection {
  id: string
  customerEmail: string
  customerName: string | null
  createdAt: Date
  notes: string | null
  photos: Array<{
    id: string
    title: string
    imageUrl: string
  }>
}

export function AdminSelections() {
  const PAGE_SIZE = 10
  const [selections, setSelections] = useState<GroupedSelection[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSelections(1)
  }, [])

  const loadSelections = async (page: number) => {
    setLoading(true)
    const result = await getSelectionsAction(page, PAGE_SIZE)

    if (result.success && result.selections) {
      setSelections(result.selections)
      setCurrentPage(page)
      setTotalPages(Math.ceil((result.total ?? 0) / PAGE_SIZE))
    } else {
      console.error("Error loading selections:", result.error)
    }
    setLoading(false)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border border-muted bg-card shadow-sm overflow-hidden">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  {/* Customer Name Placeholder */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-muted animate-pulse"></div>
                    <div className="h-5 bg-muted shimmer-gradient rounded w-1/3"></div>
                  </div>
                  {/* Contact Info Placeholder */}
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted shimmer-gradient rounded w-1/4"></div>
                    <div className="h-4 bg-muted shimmer-gradient rounded w-1/5"></div>
                  </div>
                </div>
                {/* Photo Badge Count Placeholder */}
                <div className="w-16 h-6 bg-muted shimmer-gradient rounded-full"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Optional Notes Box Placeholder */}
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="h-4 bg-muted shimmer-gradient rounded w-3/4"></div>
                <div className="h-3 bg-muted shimmer-gradient rounded w-1/2"></div>
              </div>
              
              {/* Selected Photos Placeholder */}
              <div className="space-y-2">
                <div className="h-4 bg-muted shimmer-gradient rounded w-24"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-24 w-full bg-muted shimmer-gradient rounded-lg"></div>
                      <div className="h-3 bg-muted shimmer-gradient rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Placeholder */}
              <div className="flex gap-2 pt-2">
                <div className="h-9 w-20 bg-muted shimmer-gradient rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {selections.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No customer selections yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When customers pick their favorite photos, their selections will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <>
        {selections.map((selection, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selection.customerName || "Anonymous Customer"}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selection.customerEmail}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selection.createdAt)}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary">{selection.photos.length} photos</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selection.notes && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm">{selection.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Selected Photos:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selection.photos.map((photo) => (
                    <div key={photo.id} className="space-y-1">
                      <div className="relative h-24 w-full overflow-hidden rounded-lg">
                        <Image
                          src={photo.imageUrl || "/placeholder.svg"}
                          alt={photo.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{photo.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`mailto:${selection.customerEmail}`, "_blank")}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) loadSelections(currentPage - 1) }}
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
                      onClick={(e) => { e.preventDefault(); loadSelections(p) }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) loadSelections(currentPage + 1) }}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
        </>
      )}
    </div>
  )
}

