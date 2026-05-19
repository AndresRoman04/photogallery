import { PhotoGallery } from "@/components/photo-gallery"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Photo Gallery</h1>
          <p className="text-muted-foreground text-lg">Browse our collection and select your favorites</p>
        </div>
        <PhotoGallery />
      </div>
    </main>
  )
}
