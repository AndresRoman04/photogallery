"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { registerCustomerAction } from "@/app/actions/customer-accounts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.45-1.6 4.25-5.27 4.25-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.96 3.86 14.96 3 12.18 3 7.06 3 3 7.03 3 12s4.06 9 9.18 9c5.3 0 8.82-3.72 8.82-8.96 0-.6-.07-1.06-.15-1.94Z"
      />
    </svg>
  )
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path
        fill="currentColor"
        d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.13 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.81 8.44-4.94 8.44-9.94Z"
      />
    </svg>
  )
}

export function AccountAuth({
  googleEnabled,
  facebookEnabled,
}: {
  googleEnabled: boolean
  facebookEnabled: boolean
}) {
  const router = useRouter()
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  const [registerEmail, setRegisterEmail] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registering, setRegistering] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingIn(true)
    try {
      const result = await signIn("customer-credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })
      if (result?.error) {
        toast.error("Sign in failed", { description: "Invalid email or password" })
        return
      }
      toast.success("Signed in")
      router.push("/")
      router.refresh()
    } finally {
      setLoggingIn(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistering(true)
    try {
      const result = await registerCustomerAction({
        email: registerEmail,
        password: registerPassword,
        name: registerName || undefined,
      })
      if (!result.success) {
        toast.error(result.error || "Failed to register")
        return
      }
      const signInResult = await signIn("customer-credentials", {
        email: registerEmail,
        password: registerPassword,
        redirect: false,
      })
      if (signInResult?.error) {
        toast.success("Account created — please sign in.")
        return
      }
      toast.success("Account created")
      router.push("/")
      router.refresh()
    } finally {
      setRegistering(false)
    }
  }

  const oauthButtons = (googleEnabled || facebookEnabled) && (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>
      {googleEnabled && (
        <Button variant="outline" className="w-full" onClick={() => signIn("google")}>
          <GoogleIcon className="mr-2" />
          Continue with Google
        </Button>
      )}
      {facebookEnabled && (
        <Button variant="outline" className="w-full" onClick={() => signIn("facebook")}>
          <FacebookIcon className="mr-2" />
          Continue with Facebook
        </Button>
      )}
    </div>
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <div className="rounded-full bg-primary/10 p-3">
            <User className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Your Account</CardTitle>
        <CardDescription className="text-center">
          Sign in or create an account to keep track of your photo selections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sign-in">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in" className="space-y-4 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={loggingIn}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loggingIn}
                />
              </div>
              <Button className="w-full" type="submit" disabled={loggingIn}>
                {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
            {oauthButtons}
          </TabsContent>

          <TabsContent value="register" className="space-y-4 pt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  disabled={registering}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-name">Name (optional)</Label>
                <Input
                  id="register-name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  disabled={registering}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={registering}
                />
              </div>
              <Button className="w-full" type="submit" disabled={registering}>
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>
            {oauthButtons}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
