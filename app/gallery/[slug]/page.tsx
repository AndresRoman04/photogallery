import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PhotoGallery } from "@/components/photo-gallery"

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const photographer = await prisma.user.findUnique({
    where: { slug },
    select: { name: true },
  })
  if (!photographer) notFound()

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-light tracking-tight text-foreground mb-3">
            {photographer.name || "Photo Gallery"}
          </h1>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Browse &amp; select your favorites
          </p>
        </div>
        <PhotoGallery slug={slug} />
      </div>
    </main>
  )
}
