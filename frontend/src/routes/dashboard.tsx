import { supabase } from '@/lib/supabase'
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
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
import { LogOut, Settings, User } from 'lucide-react'
import { getInitials } from '@/utils/get-initials'
import { getProfile } from '@/api/profile'
import { integrationsQueryOptions } from '@/queries/integrations'
import { subscriptionsQueryOptions } from '@/queries/subscriptions'
import { useUserProfile } from '@/hooks/user-queries'
import { userProfileQueryOptions } from '@/queries/user-profile'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      throw redirect({ to: '/' })
    }

    return { token: session?.access_token }
  },

  loader: async ({ context }) => {
    const token = (context as any).token as string

    await context.queryClient.prefetchQuery(userProfileQueryOptions(token))

    void context.queryClient.prefetchQuery(integrationsQueryOptions(token))
    void context.queryClient.prefetchQuery(subscriptionsQueryOptions(token))
  },

  component: DashboardLayout,
})

function DashboardLayout() {
  const { token } = Route.useRouteContext() as { token: string }
  const { data: profile } = useUserProfile(token)
  const navigate = useNavigate()

  const userName = profile?.name?.trim() || 'User'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <span className="text-xl font-semibold tracking-tight">ping</span>

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
                    {profile?.phone_number || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link to="/dashboard/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <Link to="/dashboard/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
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
        <Outlet />
      </main>
    </div>
  )
}


