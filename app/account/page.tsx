import { AccountAuth } from "@/components/account-auth"

// The OAuth flags below must reflect the *runtime* environment — a static
// prerender would bake in whatever GOOGLE/FACEBOOK env vars existed at build
// time (none, in Docker) and permanently hide the OAuth buttons.
export const dynamic = "force-dynamic"

export default function AccountPage() {
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const facebookEnabled = !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET)

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <AccountAuth googleEnabled={googleEnabled} facebookEnabled={facebookEnabled} />
    </div>
  )
}
