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
    <main className="flex-1 bg-background">
      <section className="border-b bg-gradient-to-b from-muted/60 via-muted/20 to-background">
        <div className="container mx-auto px-4 py-16 text-center md:py-24">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Gallery</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
            {photographer.name || "Photo Gallery"}
          </h1>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Browse &amp; select your favorites
          </p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-8">
        <PhotoGallery slug={slug} />
      </div>
    </main>
  )
}
