"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { uploadFile, getPublicUrl, deleteFile } from "@/lib/storage"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"

// Server Actions are invocable endpoints in their own right — proxy.ts only
// gates /admin page routes, and this module is also imported by the public
// gallery — so owner-scoped actions must check the session themselves.
// Returns the admin's User id, or null when the caller isn't an admin.
async function getSessionAdminId() {
  const session = await auth()
  if (session?.user?.role !== "admin" || !session.user.id) return null
  return session.user.id
}

// Public gallery on `/`: intentionally unscoped — all photographers' active
// photos mixed together (per-photographer public galleries are BFT-28).
export async function getPhotosAction(page = 1, pageSize = 12) {
  try {
    const skip = (page - 1) * pageSize
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.photo.count({ where: { isActive: true } }),
    ])
    return { success: true, photos, total, page, pageSize }
  } catch (error) {
    console.error("Failed to fetch photos:", error)
    return { success: false, error: "Failed to fetch photos" }
  }
}

// Admin "Manage Photos" view: only the logged-in photographer's own photos.
export async function getMyPhotosAction(page = 1, pageSize = 12) {
  try {
    const userId = await getSessionAdminId()
    if (!userId) {
      return { success: false, error: "Not authorized" }
    }

    const skip = (page - 1) * pageSize
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.photo.count({ where: { userId } }),
    ])
    return { success: true, photos, total, page, pageSize }
  } catch (error) {
    console.error("Failed to fetch photos:", error)
    return { success: false, error: "Failed to fetch photos" }
  }
}

export async function getSelectionsAction(page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize
    const [selections, total] = await Promise.all([
      prisma.customerSelection.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { photos: { include: { photo: true } } },
      }),
      prisma.customerSelection.count(),
    ])

    const groupedSelections = selections.map((s) => ({
      id: s.id,
      customerEmail: s.customerEmail,
      customerName: s.customerName,
      notes: s.notes,
      createdAt: s.createdAt,
      photos: s.photos.map((sp) => sp.photo),
    }))

    return { success: true, selections: groupedSelections, total, page, pageSize }
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
        photos: { create: data.selectedPhotos.map((photoId) => ({ photoId })) },
      },
    })

    revalidatePath("/admin/selections")

    // Send admin notification server-side (no exposed API endpoint needed)
    try {
      const photos = await prisma.photo.findMany({
        where: { id: { in: data.selectedPhotos } },
        select: { title: true, storagePath: true },
      })
      const photoList = photos.map((p) => `- ${p.title} (${p.storagePath})`).join("\n")
      const emailContent = `New Photo Selection Received!\n\nCustomer Details:\n- Email: ${data.customerEmail}\n- Name: ${data.customerName || "Not provided"}\n\nSelected Photos (${data.selectedPhotos.length}):\n${photoList}\n\n${data.notes ? `Additional Notes:\n${data.notes}\n\n` : ""}---\nThis notification was sent automatically from your Photo Gallery.`

      // NOTIFICATION_EMAIL is the dedicated recipient for these alerts; ADMIN_EMAIL is
      // kept only as a fallback for deployments that haven't set it yet (it now mainly
      // seeds the first DB-backed user — see prisma/seed.ts and lib/auth-credentials.ts).
      const notificationRecipient = process.env.NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL
      if (!notificationRecipient) {
        throw new Error("No notification recipient configured (set NOTIFICATION_EMAIL)")
      }

      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        to: notificationRecipient,
        subject: `New Photo Selection from ${data.customerEmail}`,
        text: emailContent,
      })
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError)
    }

    return { success: true, selection }
  } catch (error) {
    console.error("Failed to submit selection:", error)
    return { success: false, error: "Failed to submit selection" }
  }
}

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB, under the 10mb Server Actions body limit

export async function uploadPhotoAction(formData: FormData) {
  try {
    const userId = await getSessionAdminId()
    if (!userId) {
      return { success: false, error: "Not authorized" }
    }

    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!file) throw new Error("No file provided")

    const fileExt = file.name.split(".").pop()?.toLowerCase() ?? ""
    const expectedContentType = ALLOWED_CONTENT_TYPES[fileExt]

    if (!expectedContentType) {
      return { success: false, error: "Unsupported file extension. Allowed: JPG, PNG, WEBP, GIF." }
    }

    if (file.type !== expectedContentType) {
      return { success: false, error: "File content type does not match its extension." }
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: "File too large. Maximum size is 8MB." }
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // 1. Upload to S3/MinIO — re-derive the content type from the validated extension
    // rather than trusting the client-declared file.type all the way to storage.
    await uploadFile(fileName, file, expectedContentType)

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
        userId,
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

export async function deletePhotoAction(photoId: string) {
  try {
    const userId = await getSessionAdminId()
    if (!userId) {
      return { success: false, error: "Not authorized" }
    }

    // The userId filter makes ownership part of the delete itself: a photo
    // owned by someone else throws P2025 exactly like a nonexistent id, so
    // non-owners can't even learn whether the photo exists.
    const photo = await prisma.photo.delete({ where: { id: photoId, userId } })

    // Cascade on selection_photos already removed it from any customer selections.
    // Best-effort cleanup of the underlying object; a missing storage object shouldn't
    // block the DB delete from being reported as successful.
    try {
      await deleteFile(photo.storagePath)
    } catch (storageError) {
      console.error("Failed to delete photo from storage:", storageError)
    }

    revalidatePath("/admin")
    revalidatePath("/")

    return { success: true }
  } catch (error: any) {
    if (error?.code === "P2025") {
      return { success: false, error: "Photo not found" }
    }
    console.error("Failed to delete photo:", error)
    return { success: false, error: "Delete failed" }
  }
}
