"use server"

import { prisma } from "@/lib/prisma"
import { uploadFile, getPublicUrl } from "@/lib/storage"
import { revalidatePath } from "next/cache"

export async function getPhotosAction() {
  try {
    const photos = await prisma.photo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, photos }
  } catch (error) {
    console.error("Failed to fetch photos:", error)
    return { success: false, error: "Failed to fetch photos" }
  }
}

export async function getSelectionsAction() {
  try {
    const selections = await prisma.customerSelection.findMany({
      orderBy: { createdAt: "desc" },
    })

    // Fetch all photos for these selections
    const allPhotoIds = [...new Set(selections.flatMap((s) => s.selectedPhotos))]
    const photos = await prisma.photo.findMany({
      where: { id: { in: allPhotoIds } },
    })

    const photosMap = new Map(photos.map((p) => [p.id, p]))

    const groupedSelections = selections.map((s) => ({
      id: s.id,
      customerEmail: s.customerEmail,
      customerName: s.customerName,
      notes: s.notes,
      createdAt: s.createdAt,
      photos: s.selectedPhotos
        .map((id) => photosMap.get(id))
        .filter(Boolean),
    }))

    return { success: true, selections: groupedSelections }
  } catch (error) {
    console.error("Failed to fetch selections:", error)
    return { success: false, error: "Failed to fetch selections" }
  }
}

export async function submitSelectionAction(data: {
  customerEmail: string
  customerName?: string | null
  notes?: string | null
  selectedPhotos: string[]
}) {
  try {
    const selection = await prisma.customerSelection.create({
      data: {
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        notes: data.notes,
        selectedPhotos: data.selectedPhotos,
      },
    })

    revalidatePath("/admin/selections")
    return { success: true, selection }
  } catch (error) {
    console.error("Failed to submit selection:", error)
    return { success: false, error: "Failed to submit selection" }
  }
}

export async function uploadPhotoAction(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!file) throw new Error("No file provided")

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // 1. Upload to S3/MinIO
    await uploadFile(fileName, file, file.type)

    // 2. Get Public URL
    const publicUrl = await getPublicUrl(fileName)

    // 3. Save to Database via Prisma
    const photo = await prisma.photo.create({
      data: {
        title: title || file.name,
        description: description || "",
        imageUrl: publicUrl,
        storagePath: fileName,
        isActive: true,
      },
    })

    revalidatePath("/admin")
    revalidatePath("/")

    return { success: true, photo }
  } catch (error) {
    console.error("Failed to upload photo:", error)
    return { success: false, error: "Upload failed" }
  }
}
