import { AccountAuth } from "@/components/account-auth"

export default function AccountPage() {
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const facebookEnabled = !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <AccountAuth googleEnabled={googleEnabled} facebookEnabled={facebookEnabled} />
    </div>
  )
}
