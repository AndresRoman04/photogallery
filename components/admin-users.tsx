"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  getUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserPlus, Trash2, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AdminUser {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const result = await getUsersAction()
    if (result.success && result.users) {
      setUsers(result.users)
    } else {
      toast.error(result.error || "Failed to load users")
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const result = await createUserAction({ email, password, name: name || undefined })
      if (result.success && result.user) {
        setUsers((prev) => [...prev, result.user])
        toast.success(`User "${result.user.email}" created`)
        setEmail("")
        setName("")
        setPassword("")
      } else {
        toast.error(result.error || "Failed to create user")
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (userId: string) => {
    setDeletingId(userId)
    try {
      const result = await deleteUserAction(userId)
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        toast.success("User deleted")
      } else {
        toast.error(result.error || "Failed to delete user")
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordUserId) return
    setSavingPassword(true)
    try {
      const result = await updateUserAction(passwordUserId, { password: newPassword })
      if (result.success) {
        toast.success("Password updated")
        setPasswordUserId(null)
        setNewPassword("")
      } else {
        toast.error(result.error || "Failed to update password")
      }
    } finally {
      setSavingPassword(false)
    }
  }

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Name (optional)</Label>
              <Input
                id="new-user-name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Password</Label>
              <Input
                id="new-user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={creating}
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email} · Added {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog
                      open={passwordUserId === user.id}
                      onOpenChange={(open) => {
                        setPasswordUserId(open ? user.id : null)
                        if (!open) setNewPassword("")
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <KeyRound className="h-4 w-4 mr-1" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change password for {user.email}</DialogTitle>
                          <DialogDescription>
                            Set a new password for this account. They&apos;ll need to use it on their next login.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="change-password-input">New password</Label>
                          <Input
                            id="change-password-input"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={8}
                            disabled={savingPassword}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleChangePassword}
                            disabled={savingPassword || newPassword.length < 8}
                          >
                            {savingPassword ? "Saving..." : "Save Password"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={deletingId === user.id}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{user.email}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this user's account and revoke their access. This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
