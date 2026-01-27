import { createFileRoute } from '@tanstack/react-router'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, Plus, Search, Trash2 } from 'lucide-react'
import societiesJson from '@/constants/societies.json'
import { BackArrow } from '@/components/dashboard/back-arrow'
import { useRemoveSubscription, useAddSubscriptions } from '@/hooks/use-subscriptions'
import { useSubscriptions } from '@/hooks/user-queries'


export const Route = createFileRoute('/dashboard/subscriptions')({
  loader: async ({ context }) => {
    const token = (context as any).token as string
    return { token }
  },
  component: Subscriptions,
})

function Subscriptions() {
  const { token } = Route.useLoaderData() as { token: string }
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const {
    data: societies = [],
    isLoading,
    error: subscriptionsError,
  } = useSubscriptions(token)
  const removeMutation = useRemoveSubscription(token)
  const addMutation = useAddSubscriptions(token)

  const sortedSocieties = useMemo(() => {
    return [...societies].sort((a, b) =>
      a.society_name.localeCompare(b.society_name)
    )
  }, [societies])

  const subscribedSet = useMemo(() => {
    return new Set(societies.map((s: any) => s.society_name))
  }, [societies])

  const filteredSocieties = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return societiesJson
    return societiesJson.filter((s: any) => s.title.toLowerCase().includes(q))
  }, [search])

  const removeSociety = (societyName: string) => {
    removeMutation.mutate(societyName)
  }

  const toggleSelected = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const addSelected = async () => {
    const names = Array.from(selected)
    if (!names.length) return

    try {
      await addMutation.mutateAsync(names)
      setSelected(new Set())
      setSearch('')
      setAddOpen(false)
    } catch {
    }
  }

  if (isLoading && societies.length === 0) {
    return <div className="text-sm text-muted-foreground">Loading…</div>
  }

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <BackArrow />
            <h1 className="text-2xl font-semibold tracking-tight">
              Event Subscriptions
            </h1>
          </div>

          <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <p className="mt-1 text-muted-foreground">
          The societies you're currently subscribed to.
        </p>
        {subscriptionsError ? (
          <p className="mt-3 text-sm text-destructive">
            Couldn’t load subscriptions. Please try again.
          </p>
        ) : null}
        {removeMutation.isError ? (
          <p className="mt-3 text-sm text-destructive">
            Couldn’t remove subscription. Please try again.
          </p>
        ) : null}
        {addMutation.isError ? (
          <p className="mt-3 text-sm text-destructive">
            Couldn’t add subscriptions. Please try again.
          </p>
        ) : null}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add societies</DialogTitle>
            <DialogDescription>
              Search and select societies to subscribe to.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 min-w-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search societies…"
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[360px] rounded-md border border-border">
              <div className="p-2">
                {filteredSocieties.slice(0, 200).map((s: any) => {
                  const name = s.title
                  const alreadySubscribed = subscribedSet.has(name)
                  const isSelected = selected.has(name)
                  const disabled = alreadySubscribed

                  return (
                    <button
                      key={s.societyid ?? name}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleSelected(name)}
                      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? 'bg-accent' : ''
                        }`}
                    >
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {alreadySubscribed ? 'Already subscribed' : 'Tap to select'}
                        </p>
                      </div>

                      <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center">
                        {alreadySubscribed ? (
                          <Check className="h-4 w-4 text-muted-foreground" />
                        ) : isSelected ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : null}
                      </div>
                    </button>
                  )
                })}
                {filteredSocieties.length > 200 ? (
                  <p className="px-2 py-2 text-xs text-muted-foreground">
                    Showing first 200 matches. Refine your search to narrow results.
                  </p>
                ) : null}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="secondary"
              onClick={() => {
                setSelected(new Set())
                setSearch('')
                setAddOpen(false)
              }}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={addSelected}
              disabled={addMutation.isPending || selected.size === 0}
            >
              {addMutation.isPending
                ? 'Adding…'
                : `Add ${selected.size || ''}`.trim()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sortedSocieties.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          You don’t have any subscriptions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSocieties.map((society: any) => {
            const isRemoving =
              removeMutation.isPending &&
              removeMutation.variables === society.society_name
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
