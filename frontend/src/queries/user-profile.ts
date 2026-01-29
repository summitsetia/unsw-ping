
import { getProfile } from "@/api/profile"
import { queryOptions } from "@tanstack/react-query"

export const userProfileQueryOptions = (token: string) => {
  return queryOptions({
    queryKey: ["user-profile", token],
    queryFn: () => getProfile(token),
    enabled: !!token,
  })
}