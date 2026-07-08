import Link from "next/link"
import Image from "next/image"
import { getPhotographersAction } from "@/app/actions/photos"
import { Card, CardContent } from "@/components/ui/card"

export default async function Home() {
  const result = await getPhotographersAction()
  const photographers = result.success ? (result.photographers ?? []) : []

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-light tracking-tight text-foreground mb-3">Photo Gallery</h1>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Choose a photographer to browse their gallery
          </p>
        </div>

        {!result.success ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-destructive mb-2">Connection Error</h2>
            <p className="text-muted-foreground">Failed to load photographers. Please try again.</p>
          </Card>
        ) : photographers.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-foreground text-lg">No galleries available yet.</p>
            <p className="text-muted-foreground text-sm mt-2">Check back soon for new additions!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photographers.map((photographer) => (
              <Link key={photographer.slug} href={`/gallery/${photographer.slug}`} className="group">
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {photographer.coverImageUrl ? (
                      <Image
                        src={photographer.coverImageUrl}
                        alt={photographer.name || photographer.slug}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">📸</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 text-card-foreground group-hover:text-primary transition-colors duration-300">
                      {photographer.name || photographer.slug}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {photographer.photoCount} photo{photographer.photoCount === 1 ? "" : "s"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
