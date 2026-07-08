"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { uploadPhotoAction, getMyPhotosAction, deletePhotoAction } from "@/app/actions/photos"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Upload, X, ImageIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface UploadedPhoto {
  id: string
  imageUrl: string
  title: string
  description: string | null
}

export function AdminUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [titles, setTitles] = useState<{ [key: string]: string }>({})
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({})
  const [previews, setPreviews] = useState<{ [key: string]: string }>({})
  const [existingPhotos, setExistingPhotos] = useState<UploadedPhoto[]>([])
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadExistingPhotos()
  }, [])

  const loadExistingPhotos = async () => {
    setLoadingExisting(true)
    const result = await getMyPhotosAction(1, 100)
    if (result.success && result.photos) {
      setExistingPhotos(result.photos)
    } else {
      console.error("Error loading existing photos:", result.error)
    }
    setLoadingExisting(false)
  }

  const handleDeletePhoto = async (photoId: string) => {
    setDeletingId(photoId)
    try {
      const result = await deletePhotoAction(photoId)
      if (result.success) {
        setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId))
        toast.success("Photo deleted")
      } else {
        toast.error(result.error || "Failed to delete photo")
      }
    } finally {
      setDeletingId(null)
    }
  }

  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => ALLOWED_TYPES.has(file.type))
    const rejectedFiles = files.filter((file) => !ALLOWED_TYPES.has(file.type))
    rejectedFiles.forEach((file) => toast.error(`"${file.name}" is not a supported image type.`))
    const newPreviews: { [key: string]: string } = {}
    imageFiles.forEach((file) => {
      newPreviews[file.name] = URL.createObjectURL(file)
    })
    setPreviews((prev) => ({ ...prev, ...newPreviews }))
    setSelectedFiles((prev) => [...prev, ...imageFiles])
  }

  const removeFile = (index: number) => {
    const file = selectedFiles[index]
    if (previews[file.name]) {
      URL.revokeObjectURL(previews[file.name])
      setPreviews((prev) => {
        const next = { ...prev }
        delete next[file.name]
        return next
      })
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadPhotos = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    const newPhotos: UploadedPhoto[] = []

    try {
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append("file", file)
        const photoTitle = titles[file.name] || file.name
        formData.append("title", photoTitle)
        formData.append("description", descriptions[file.name] || "")

        const result = await uploadPhotoAction(formData)

        if (result.success && result.photo) {
          newPhotos.push(result.photo)
          toast.success(`Successfully uploaded "${photoTitle}"`)
        } else {
          console.error("Upload failed for file:", file.name, result.error)
          toast.error(`Failed to upload "${file.name}": ${result.error || "Unknown error"}`)
        }
      }

      Object.values(previews).forEach((url) => URL.revokeObjectURL(url))
      setExistingPhotos((prev) => [...newPhotos, ...prev])
      setSelectedFiles([])
      setTitles({})
      setDescriptions({})
      setPreviews({})
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Upload failed. Please try again.")
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
              accept="image/jpeg,image/png,image/webp,image/gif"
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
                        {previews[file.name] ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-md">
                            <Image
                              src={previews[file.name]}
                              alt={file.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        )}
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

      <Card>
        <CardHeader>
          <CardTitle>Manage Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExisting ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-48 w-full bg-muted shimmer-gradient rounded-lg"></div>
                  <div className="h-4 bg-muted shimmer-gradient rounded w-2/3"></div>
                  <div className="h-3 bg-muted shimmer-gradient rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : existingPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No photos yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload your first photo to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingPhotos.map((photo) => (
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
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium">{photo.title}</h4>
                      {photo.description && <p className="text-sm text-muted-foreground">{photo.description}</p>}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === photo.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{photo.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the photo and its file from storage. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePhoto(photo.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
