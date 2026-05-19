"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Calendar, User, MessageSquare } from "lucide-react"

interface CustomerSelection {
  id: string
  customer_email: string
  customer_name: string | null
  notes: string | null
  selected_at: string
  photo: {
    id: string
    title: string
    filename: string
    url: string
  }
}

interface GroupedSelection {
  customer_email: string
  customer_name: string | null
  selected_at: string
  notes: string | null
  photos: Array<{
    id: string
    title: string
    filename: string
    url: string
  }>
}

export function AdminSelections() {
  const [selections, setSelections] = useState<GroupedSelection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSelections()
  }, [])

  const loadSelections = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("customer_selections")
      .select(`
        id,
        customer_email,
        customer_name,
        notes,
        selected_at,
        photo:photos(id, title, filename, url)
      `)
      .order("selected_at", { ascending: false })

    if (error) {
      console.error("Error loading selections:", error)
    } else {
      // Group selections by customer email and selection time
      const grouped = groupSelectionsByCustomer(data as CustomerSelection[])
      setSelections(grouped)
    }
    setLoading(false)
  }

  const groupSelectionsByCustomer = (data: CustomerSelection[]): GroupedSelection[] => {
    const groups: { [key: string]: GroupedSelection } = {}

    data.forEach((selection) => {
      const key = `${selection.customer_email}-${selection.selected_at}`

      if (!groups[key]) {
        groups[key] = {
          customer_email: selection.customer_email,
          customer_name: selection.customer_name,
          selected_at: selection.selected_at,
          notes: selection.notes,
          photos: [],
        }
      }

      groups[key].photos.push(selection.photo)
    })

    return Object.values(groups)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
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
                    {selection.customer_name || "Anonymous Customer"}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selection.customer_email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selection.selected_at)}
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
                      <img
                        src={photo.url || "/placeholder.svg"}
                        alt={photo.title}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground truncate">{photo.title}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`mailto:${selection.customer_email}`, "_blank")}
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
