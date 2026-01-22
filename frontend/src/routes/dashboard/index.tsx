import { supabase } from '@/lib/supabase'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Link2,
  LogOut,
  Settings,
  User,
  MailCheck,
} from 'lucide-react'
import { MenuItem } from '@/components/dashboard/menu-item'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw redirect({ to: '/' })
    }

    return { userId: user.id }
  },

  loader: async ({ context }) => {
    const userId = (context as any).userId as string

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_auth_user_id', userId)
      .single()

    if (error) {
      return { profile: null }
    }

    return { profile }
  },

  component: Dashboard,
})

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getInitials(name: string | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function Dashboard() {
  const { profile } = Route.useLoaderData() as {
    profile: { name?: string; phone_number: string } | null
  }
  const navigate = useNavigate()

  const userName = profile?.name?.trim() || 'User'
  const greeting = getGreeting()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/' })
  }

  const menuItems = [
    {
      title: 'Event Subscriptions',
      description: 'Manage your event subscriptions',
      icon: MailCheck,
      href: '/subscriptions',
    },
    {
      title: 'Integrations',
      description: 'Connect your calendar and apps',
      icon: Link2,
      href: '/integrations',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">UNSW Ping</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-0.5 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src="" alt={userName} />
                  <AvatarFallback className="bg-linear-to-br from-violet-500 to-purple-600 text-sm font-medium text-white">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.phone_number}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {userName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            What would you like to do today?
          </p>
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
      </main>
    </div>
  )
}


