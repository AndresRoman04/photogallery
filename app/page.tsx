import { PhotoGallery } from "@/components/photo-gallery"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-light tracking-tight text-foreground mb-3">Photo Gallery</h1>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Browse &amp; select your favorites
          </p>
        </div>
        <PhotoGallery />
      </div>
    </main>
  )
}
