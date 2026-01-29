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
}

function PromptsPage() {
  const PING_NUMBER = '+1 (402) 613-7710'

  const [search, setSearch] = useState('')

  const prompts: PromptItem[] = [
    {
      id: 'find-events-with-free-food',
      title: 'Find events with free food',
      description: 'Get a shortlist of events with free food',
      message: 'Any events with free food happening soon?',
    },
    {
      id: 'events-happening-for-degree',
      title: 'Find events happening for my degree',
      description: 'Get a shortlist of events happening for my degree',
      message: 'Any events happening soon for <degree name> students?',
    },
    {
      id: 'networking-events',
      title: 'Find networking events',
      description: 'Get a shortlist of networking events happening soon',
      message: 'Any networking events happening soon?',
    },
    {
      id: 'meet-people',
      title: 'Find events to meet people',
      description: 'Get a shortlist of events to meet people',
      message:
        'Any events to meet people happening soon?',
    },
    {
      id: 'party-events',
      title: 'Find party events',
      description: 'Get a shortlist of party events happening soon',
      message: 'Any party events happening soon?',
    },
    {
      id: 'hackathons',
      title: 'Find hackathons',
      description: 'Get a shortlist of hackathons happening soon',
      message: 'Any hackathons happening soon?',
    },
  ]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return prompts
    return prompts.filter((p) => {
      const hay = `${p.title} ${p.description}`.toLowerCase()
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
        Tip: edit the prompt placeholders like <span className="font-medium">&lt;degree name&gt;</span> before sending.
      </div>
    </>
  )
}
