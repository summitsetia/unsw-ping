import { createFileRoute } from '@tanstack/react-router'
import { BackArrow } from '@/components/dashboard/back-arrow'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

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
} from '@/components/ui/alert-dialog'
import { deleteAccount } from '@/api/profile'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false)
  const { token } = Route.useRouteContext() as { token: string }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)

      await deleteAccount(token)
      await supabase.auth.signOut()

      window.location.href = '/'
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center gap-2">
          <BackArrow />
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Manage your account and security preferences.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-destructive/30 bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Danger zone</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Delete your account permanently. This can’t be undone.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete account'}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your Ping account and all your
                    data. You’ll be logged out immediately. This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>

                  <AlertDialogAction
                    disabled={isDeleting}
                    onClick={(e) => {
                      e.preventDefault()
                      void handleDeleteAccount()
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <span className="flex items-center text-white">{isDeleting ? 'Deleting...' : 'Yes, delete'}</span>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="mt-3 rounded-lg bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              Make sure you’re absolutely certain before deleting.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
