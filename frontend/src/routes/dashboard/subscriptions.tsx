import { supabase } from '@/lib/supabase'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { ArrowLeft, Trash2 } from 'lucide-react'
import societiesJson from '@/constants/societies.json'

export const Route = createFileRoute('/dashboard/subscriptions')({
  loader: async ({ context }) => {
    const userId = (context as any).userId as string

    const { data: societies, error } = await supabase
      .from('user_societies')
      .select('society_name')
      .eq('user_id', userId)

    if (error) {
      return { societies: [], userId }
    }

    return { societies, userId }
  },
  component: Subscriptions,
})

function Subscriptions() {
  const { societies: initialSocieties, userId } = Route.useLoaderData() as {
    societies: { society_name: string }[]
    userId: string
  }
  const [societies, setSocieties] = useState(initialSocieties)
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const sortedSocieties = useMemo(() => {
    return [...societies].sort((a, b) =>
      a.society_name.localeCompare(b.society_name)
    )
  }, [societies])

  const removeSociety = async (societyName: string) => {
    setError(null)
    setRemoving((m) => ({ ...m, [societyName]: true }))

    const { error: deleteError } = await supabase
      .from('user_societies')
      .delete()
      .eq('user_id', userId)
      .eq('society_name', societyName)

    if (deleteError) {
      setError('Could not remove subscription. Please try again.')
      setRemoving((m) => ({ ...m, [societyName]: false }))
      return
    }

    setSocieties((prev) =>
      prev.filter((s) => s.society_name !== societyName)
    )
    setRemoving((m) => ({ ...m, [societyName]: false }))
  }

  return (
    <>
      <div className="mb-10">
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          className="-ml-2 mb-3"
        >
          <Link to="/dashboard" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <h1 className="text-2xl font-semibold tracking-tight">
          Event Subscriptions
        </h1>
        <p className="mt-1 text-muted-foreground">
          The societies you’re currently subscribed to.
        </p>
        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}
      </div>

      {sortedSocieties.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          You don’t have any subscriptions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSocieties.map((society) => {
            const isRemoving = !!removing[society.society_name]
            const societyImage = societiesJson.find(
              (s) => s.title === society.society_name
            )?.image
            return (
              <div
                key={society.society_name}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex items-center gap-3">
                  {societyImage ? (
                    <img
                      src={societyImage}
                      alt={society.society_name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-medium">{society.society_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Receiving updates for events and announcements
                    </p>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive"
                      aria-label={`Remove ${society.society_name}`}
                      disabled={isRemoving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will unsubscribe you from{' '}
                        <span className="font-medium">
                          {society.society_name}
                        </span>
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isRemoving}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeSociety(society.society_name)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? 'Removing…' : 'Remove'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
