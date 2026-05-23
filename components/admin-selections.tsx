"use client"

import { useState, useEffect } from "react"
import { getSelectionsAction } from "@/app/actions/photos"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Calendar, User, MessageSquare } from "lucide-react"

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
  const [selections, setSelections] = useState<GroupedSelection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSelections()
  }, [])

  const loadSelections = async () => {
    setLoading(true)
    const result = await getSelectionsAction()

    if (result.success && result.selections) {
      setSelections(result.selections as any)
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
          <Card key={i} className="overflow-hidden border border-gray-150 dark:border-gray-800 shadow-md">
            <CardHeader className="space-y-2 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50">
              <div className="flex items-center justify-between">
                <div className="space-y-2 w-1/2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-2/3 animate-pulse"></div>
                  <div className="flex gap-4">
                    <div className="h-3 bg-gray-150 dark:bg-gray-850 rounded w-1/3 animate-pulse"></div>
                    <div className="h-3 bg-gray-150 dark:bg-gray-850 rounded w-1/4 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="h-10 bg-gray-100 dark:bg-gray-900/50 rounded-lg w-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28 animate-pulse"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-24 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-lg animate-pulse"></div>
                      <div className="h-3 bg-gray-150 dark:bg-gray-850 rounded w-2/3 animate-pulse"></div>
                    </div>
                  ))}
                </div>
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
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No customer selections yet.</p>
        </Card>
      ) : (
        selections.map((selection, index) => (
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
        ))
      )}
    </div>
  )
}

