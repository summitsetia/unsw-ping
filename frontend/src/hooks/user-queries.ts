import { getGoogleCalendarIntegration } from "@/api/integrations"
import { addSubscriptions, getSubscriptions, removeSubscription } from "@/api/subscriptions"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useSubscriptions = (userId: string) => {
  return useQuery({
    queryKey: ["subscriptions", userId],
    queryFn: () => getSubscriptions(userId),
    enabled: !!userId,
  })
}

export const useIntegrations = (userId: string) => {
  return useQuery({
    queryKey: ["integrations", userId],
    queryFn: () => getGoogleCalendarIntegration(userId),
    enabled: !!userId,
  })
}

export function useRemoveSubscription(userId: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (societyName: string) => {
      return removeSubscription(userId, societyName)
    },

    onMutate: async (societyName) => {
      const key = ["subscriptions", userId]
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData(key)

      client.setQueryData(key, (old: any) =>
        (old ?? []).filter((s: any) => s.society_name !== societyName)
      )
      return { previous }
    },

    onError: (_err, _societyName, context) => {
      client.setQueryData(["subscriptions", userId], context?.previous)
    },

    onSettled: () => {
      client.invalidateQueries({ queryKey: ["subscriptions", userId] })
    },
  })
}

export function useAddSubscriptions(userId: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (societyNames: string[]) => {
      return addSubscriptions(userId, societyNames)
    },

    onMutate: async (societyNames) => {
      const key = ["subscriptions", userId]
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<{ society_name: string }[]>(key) ?? []

      const existing = new Set(previous.map((s) => s.society_name))
      const optimisticAdd = societyNames
        .filter((name) => !existing.has(name))
        .map((society_name) => ({ society_name }))

      client.setQueryData(key, [...previous, ...optimisticAdd])
      return { previous }
    },

    onError: (_err, _societyNames, context) => {
      client.setQueryData(["subscriptions", userId], context?.previous ?? [])
    },

    onSettled: () => {
      client.invalidateQueries({ queryKey: ["subscriptions", userId] })
    },
  })
}
