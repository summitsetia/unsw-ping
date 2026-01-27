import { createFileRoute } from '@tanstack/react-router'
import { BackArrow } from '@/components/dashboard/back-arrow'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import { Copy, MessageCircle, Search } from 'lucide-react'
import { smsLink } from '@/utils/sms'

export const Route = createFileRoute('/dashboard/prompts')({
  component: PromptsPage,
})

type PromptItem = {
  id: string
  title: string
  description: string
  message: string
  category?: string
}

function PromptsPage() {
  const PING_NUMBER = '+1 (402) 613-7710'

  const [search, setSearch] = useState('')

  const prompts: PromptItem[] = [
    {
      id: 'find-events',
      title: 'Find events this week',
      description: 'Get a shortlist of events from my subscribed societies.',
      category: 'Events',
      message:
        `Find events happening this week from my subscribed societies. ` +
        `Show title, time (Sydney), location, and include links if possible.`,
    },
    {
      id: 'add-society',
      title: 'Subscribe to a society',
      description: 'Tell Ping what society I want added.',
      category: 'Subscriptions',
      message:
        `Subscribe me to: <society name>\n` +
        `If there are multiple matches, ask me to pick one.`,
    },
    {
      id: 'unsub-society',
      title: 'Unsubscribe from a society',
      description: 'Stop getting updates from one society.',
      category: 'Subscriptions',
      message: `Unsubscribe me from: <society name>`,
    },
    {
      id: 'calendar',
      title: 'Add next event to my calendar',
      description: 'Create a calendar entry with location + reminders.',
      category: 'Calendar',
      message:
        `Add the next event I’m going to into my calendar. ` +
        `Use the correct timezone and set a reminder 1 hour before.`,
    },
    {
      id: 'study-plan',
      title: 'Plan my week',
      description: 'Turn deadlines + events into a simple schedule.',
      category: 'Productivity',
      message:
        `Help me plan this week. Ask for my deadlines + commitments, ` +
        `then make a simple daily plan (1–2 key tasks per day).`,
    },
    {
      id: 'quick-help',
      title: 'Quick question',
      description: 'Open a blank message to Ping.',
      category: 'General',
      message: `Hey Ping — `,
    },
  ]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return prompts
    return prompts.filter((p) => {
      const hay = `${p.title} ${p.description} ${p.category ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [search])

  const openPrompt = (p: PromptItem) => {
    const href = smsLink(PING_NUMBER, p.message) || ''
    window.location.assign(href)
  }

  const copyPrompt = async (p: PromptItem) => {
    try {
      await navigator.clipboard.writeText(p.message)
    } catch {
    }
  }

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center gap-2">
          <BackArrow />
          <h1 className="text-2xl font-semibold tracking-tight">Prompts</h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Tap a prompt to message Ping with the details pre-filled.
        </p>

        <div className="mt-4 relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No prompts found.
        </div>
      ) : (
        <ScrollArea className="rounded-xl border border-border">
          <div className="p-2 space-y-2">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
              >
                <button
                  type="button"
                  onClick={() => openPrompt(p)}
                  className="min-w-0 flex flex-1 items-center gap-3 text-left"
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{p.title}</p>
                      {p.category ? (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {p.category}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                </button>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openPrompt(p)}
                  >
                    Use
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Copy prompt"
                    onClick={() => copyPrompt(p)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        Tip: edit the prompt placeholders like <span className="font-medium">&lt;society name&gt;</span> before sending.
      </div>
    </>
  )
}
