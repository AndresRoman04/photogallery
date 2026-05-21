"use client"

import type React from "react"
import { useState } from "react"
import { uploadPhotoAction } from "@/app/actions/photos"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, ImageIcon } from "lucide-react"

interface UploadedPhoto {
  id: string
  imageUrl: string
  title: string
  description: string
}

export function AdminUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [titles, setTitles] = useState<{ [key: string]: string }>({})
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({})

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

    setUploading(true)
    const newPhotos: UploadedPhoto[] = []

    try {
      console.log("[v0] Starting photo upload process...")
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("title", titles[file.name] || file.name)
        formData.append("description", descriptions[file.name] || "")

        const result = await uploadPhotoAction(formData)

        if (result.success && result.photo) {
          console.log("[v0] Photo saved successfully:", result.photo)
          newPhotos.push(result.photo as any)
        } else {
          console.error("[v0] Upload failed for file:", file.name, result.error)
        }
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
                  <div className="relative h-48 w-full overflow-hidden rounded-lg">
                    <Image
                      src={photo.imageUrl || "/placeholder.svg"}
                      alt={photo.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
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

