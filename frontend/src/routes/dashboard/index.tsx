import { createFileRoute, useMatch } from '@tanstack/react-router'
import { Link2, MailCheck } from 'lucide-react'
import { MenuItem } from '@/components/dashboard/menu-item'

export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
})

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function Dashboard() {
  const dashboardMatch = useMatch({ from: '/dashboard' })
  const { profile } = (dashboardMatch.loaderData ?? {}) as {
    profile: { name?: string } | null
  }

  const userName = profile?.name?.trim() || 'User'
  const greeting = getGreeting()

  const menuItems = [
    {
      title: 'Event Subscriptions',
      description: 'Manage your event subscriptions',
      icon: MailCheck,
      href: '/dashboard/subscriptions',
    },
    {
      title: 'Integrations',
      description: 'Connect your calendar and apps',
      icon: Link2,
      href: '/dashboard/integrations',
    },
  ]

  return (
    <>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {userName}
        </h1>
        <p className="mt-1 text-muted-foreground">What would you like to do today?</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <MenuItem
            key={item.title}
            title={item.title}
            description={item.description}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </nav>
    </>
  )
}


