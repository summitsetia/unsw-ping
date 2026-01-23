import { createFileRoute } from '@tanstack/react-router'
import { BackArrow } from '@/components/dashboard/back-arrow'
import { useIntegrations } from '@/hooks/user-queries'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/integrations')({
  loader: async ({ context }) => {
    const userId = (context as any).userId as string
    return { userId }
  },
  component: Integrations,
})

function Integrations() {
  const { userId } = Route.useLoaderData() as { userId: string }
  const { data: integration } = useIntegrations(userId)

  const handleConnectGoogle = async () => {
    const backendBaseUrl =
      (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
      'http://localhost:3000'

    const resp = await fetch(
      `${backendBaseUrl}/google/link?userId=${encodeURIComponent(userId)}`
    )
    if (!resp.ok) {
      throw new Error('Failed to start Google OAuth')
    }
    const data = (await resp.json()) as { url?: string }
    if (!data.url) {
      throw new Error('Missing OAuth URL')
    }
    window.location.assign(data.url)
  }

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center gap-2">
          <BackArrow />
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Connect your calendar and apps to UNSW Ping.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <img
              src="/google-calender.png"
              alt="Google Calendar"
              className="h-10 w-10 shrink-0 rounded-lg object-contain"
            />
            <div className="min-w-0">
              <p className="font-medium text-foreground">Google Calendar</p>
              <p className="text-sm text-muted-foreground">
                {integration ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {integration ? (
            <span className="shrink-0 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
              Active
            </span>
          ) : (
            <Button size="sm" onClick={handleConnectGoogle}>
              Connect
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

