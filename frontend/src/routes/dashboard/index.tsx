import { createFileRoute } from '@tanstack/react-router'
import { Link2, MailCheck, MessageCircleMore } from 'lucide-react'
import { MenuItem } from '@/components/dashboard/menu-item'
import { getGreeting } from '@/utils/get-greeting'
import { useUserProfile } from '@/hooks/user-queries'

export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
})

function Dashboard() {
  const { token } = Route.useRouteContext() as { token: string }
  const { data: profile } = useUserProfile(token)

  const userName = profile?.name?.trim() || 'User'
  const greeting = getGreeting()

  const menuItems = [
    {
      title: 'Prompts',
      description: 'Browse through our prompts to message ping',
      icon: MessageCircleMore,
      to: '/dashboard/prompts',
    },
    {
      title: 'Event Subscriptions',
      description: 'Manage your event subscriptions',
      icon: MailCheck,
      to: '/dashboard/subscriptions',
    },
    {
      title: 'Integrations',
      description: 'Connect your calendar and apps',
      icon: Link2,
      to: '/dashboard/integrations',
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
            to={item.to}
          />
        ))}
      </nav>
    </>
  )
}


