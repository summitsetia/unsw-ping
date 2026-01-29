import { updateProfile } from "@/api/profile"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useUpdateUserProfile(token: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      return updateProfile(token, name)
    },

    onMutate: async (name) => {
      const key = ["user-profile", token]
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData(key)

      client.setQueryData(key, (old: any) => ({
        ...(old ?? {}),
        name,
      }))
      return { previous }
    },

    onError: (_err, _name, context) => {
      client.setQueryData(["user-profile", token], context?.previous)
    },

    onSettled: () => {
      client.invalidateQueries({ queryKey: ["user-profile", token] })
    },
  })
}