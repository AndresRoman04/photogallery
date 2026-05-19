"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, ImageIcon } from "lucide-react"

interface UploadedPhoto {
  id: string
  filename: string
  url: string
  title: string
  description: string
}

export function AdminUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [titles, setTitles] = useState<{ [key: string]: string }>({})
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({})

  const getSupabaseClient = () => {
    try {
      console.log("[v0] Getting Supabase client for admin upload...")
      if (typeof window === "undefined") {
        console.log("[v0] Running on server side, skipping client creation")
        return null
      }

      const client = createClient()
      console.log("[v0] Admin upload Supabase client retrieved successfully")
      return client
    } catch (error) {
      console.error("[v0] Failed to get Supabase client in admin upload:", error)
      return null
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    setSelectedFiles((prev) => [...prev, ...imageFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadPhotos = async () => {
    if (selectedFiles.length === 0) return

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("[v0] Supabase client not available for upload")
      alert("Database connection error. Please refresh the page and try again.")
      return
    }

    setUploading(true)
    const newPhotos: UploadedPhoto[] = []

    try {
      console.log("[v0] Starting photo upload process...")
      for (const file of selectedFiles) {
        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        console.log("[v0] Uploading file:", fileName)
        const { data: uploadData, error: uploadError } = await supabase.storage.from("photos").upload(fileName, file)

        if (uploadError) {
          console.error("[v0] Upload error:", uploadError)
          continue
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(fileName)

        console.log("[v0] File uploaded, saving to database...")
        const { data: photoData, error: dbError } = await supabase
          .from("photos")
          .insert({
            filename:fileName,
            image_url: publicUrl,
            storage_path: fileName,
            title: titles[file.name] || file.name,
            description: descriptions[file.name] || "",
            is_active: true,
          })
          .select()
          .single()

        if (dbError) {
          console.error("[v0] Database error:", dbError)
          continue
        }

        console.log("[v0] Photo saved successfully:", photoData)
        newPhotos.push(photoData)
      }

      setUploadedPhotos((prev) => [...prev, ...newPhotos])
      setSelectedFiles([])
      setTitles({})
      setDescriptions({})
      console.log("[v0] Upload process completed successfully")
    } catch (error) {
      console.error("[v0] Upload failed:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Database connection error. Please refresh the page and try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="photo-upload">Select Photos</Label>
            <Input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Selected Photos ({selectedFiles.length})</h3>
              <div className="grid gap-4">
                {selectedFiles.map((file, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{file.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`title-${index}`}>Title</Label>
                            <Input
                              id={`title-${index}`}
                              placeholder="Photo title"
                              value={titles[file.name] || ""}
                              onChange={(e) =>
                                setTitles((prev) => ({
                                  ...prev,
                                  [file.name]: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`desc-${index}`}>Description</Label>
                            <Textarea
                              id={`desc-${index}`}
                              placeholder="Photo description"
                              value={descriptions[file.name] || ""}
                              onChange={(e) =>
                                setDescriptions((prev) => ({
                                  ...prev,
                                  [file.name]: e.target.value,
                                }))
                              }
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button onClick={uploadPhotos} disabled={uploading} className="w-full">
                {uploading
                  ? "Uploading..."
                  : `Upload ${selectedFiles.length} Photo${selectedFiles.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Uploaded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} className="space-y-2">
                  <img
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium">{photo.title}</h4>
                    {photo.description && <p className="text-sm text-muted-foreground">{photo.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
