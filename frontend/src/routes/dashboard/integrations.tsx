import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/integrations')({
  component: Integrations,
})

function Integrations() {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Connect your calendar and apps to UNSW Ping.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Coming soon.
      </div>
    </>
  )
}

