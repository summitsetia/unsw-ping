import { createFileRoute } from '@tanstack/react-router'
import { BackArrow } from '@/components/dashboard/back-arrow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUserProfile } from '@/hooks/user-queries'
import { useUpdateUserProfile } from '@/hooks/use-profile'

export const Route = createFileRoute('/dashboard/profile')({
  component: ProfilePage,
})

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Too short.')
    .max(50, 'Too long (max 50).')
    .regex(
      /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
      "Use letters only (spaces, hyphens, apostrophes allowed)."
    ),
})

type FormValues = z.infer<typeof formSchema>

function ProfilePage() {
  const { token } = Route.useRouteContext() as { token: string }
  const { data: profile } = useUserProfile(token)

  const updateUserProfile = useUpdateUserProfile(token)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile.name ?? '',
    },
    mode: 'onChange',
  })

  const isDirty = form.formState.isDirty
  const isValid = form.formState.isValid
  const isSubmitting = form.formState.isSubmitting

  const onSubmit = async (values: FormValues) => {
    await updateUserProfile.mutateAsync(values.name)
    form.reset(values)
  }

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center gap-2">
          <BackArrow />
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Update your account details for UNSW Ping.
        </p>
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Name</p>
              <p className="text-sm text-muted-foreground">
                This is what Ping will call you.
              </p>
            </div>

            <Button
              size="sm"
              type="submit"
              form="profile-form"
              disabled={!isDirty || !isValid || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>

          <div className="mt-4">
            <Form {...form}>
              <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="e.g. Summit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            <div className="mt-2 flex items-center justify-between">
              {isDirty ? (
                <p className="text-xs text-muted-foreground">Unsaved changes</p>
              ) : (
                <p className="text-xs text-muted-foreground">Up to date</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
