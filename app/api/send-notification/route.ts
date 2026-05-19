import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  try {
    const { customerEmail, customerName, photoIds, notes } = await request.json()

    const supabase = await createClient()

    // Get photo details for the email
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("title, storage_path")
      .in("id", photoIds)

    if (photosError) {
      console.error("Error fetching photos:", photosError)
      return NextResponse.json({ error: "Failed to fetch photo details" }, { status: 500 })
    }

    // Create email content
    const photoList = photos?.map((photo) => `- ${photo.title} (${photo.storage_path})`).join("\n") || ""

    const emailContent = `
New Photo Selection Received!

Customer Details:
- Email: ${customerEmail}
- Name: ${customerName || "Not provided"}

Selected Photos (${photoIds.length}):
${photoList}

${notes ? `Additional Notes:\n${notes}` : ""}

---
This notification was sent automatically from your Photo Gallery.
    `.trim()

    // Send email using Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'rmnandres@gmail.com', // Replace with your admin email
      subject: `New Photo Selection from ${customerEmail}`,
      text: emailContent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email notification error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
