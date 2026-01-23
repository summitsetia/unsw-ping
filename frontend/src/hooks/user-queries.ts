import { getGoogleCalendarIntegration } from "@/api/integrations"
import { getSubscriptions, removeSubscription } from "@/api/subscriptions"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useSubscriptions = (userId: string) => {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => getSubscriptions(userId),
  })
}

export const useIntegrations = (userId: string) => {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: () => getGoogleCalendarIntegration(userId),
  })
}

export function useRemoveSubscription(userId: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (societyName: string) => {
      return removeSubscription(userId, societyName)
    },

    onMutate: async (societyName) => {
      await client.cancelQueries({ queryKey: ['subscriptions'] })
      const previous = client.getQueryData(['subscriptions']) 

      client.setQueryData(['subscriptions'], (old: any) =>
        (old).filter((s: any) => s.society_name !== societyName)
      )
      return { previous }
    },

    onError: () => {
      client.setQueryData(['subscriptions'], (old: any) => old)
    },

    onSettled: () => {
      client.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}
