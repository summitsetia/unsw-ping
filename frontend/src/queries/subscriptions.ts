import { getSubscriptions } from "@/api/subscriptions"
import { queryOptions } from "@tanstack/react-query"

export const subscriptionsQueryOptions = (token: string) => {
  return queryOptions({
    queryKey: ["subscriptions", token],
    queryFn: () => getSubscriptions(token),
    enabled: !!token,
  })
}