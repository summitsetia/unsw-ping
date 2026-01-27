import { addSubscriptions, removeSubscription } from "@/api/subscriptions"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useRemoveSubscription(token: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (societyName: string) => {
      return removeSubscription(token, societyName)
    },

    onMutate: async (societyName) => {
      const key = ["subscriptions", token]
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData(key)

      client.setQueryData(key, (old: any) =>
        (old ?? []).filter((s: any) => s.society_name !== societyName)
      )
      return { previous }
    },

    onError: (_err, _societyName, context) => {
      client.setQueryData(["subscriptions", token], context?.previous)
    },

    onSettled: () => {
      client.invalidateQueries({ queryKey: ["subscriptions", token] })
    },
  })
}

export function useAddSubscriptions(token: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (societyNames: string[]) => {
      return addSubscriptions(token, societyNames)
    },

    onMutate: async (societyNames) => {
      const key = ["subscriptions", token]
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
      client.setQueryData(["subscriptions", token], context?.previous ?? [])
    },

    onSettled: () => {
      client.invalidateQueries({ queryKey: ["subscriptions", token] })
    },
  })
}