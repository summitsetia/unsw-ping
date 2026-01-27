import { integrationsQueryOptions } from "@/queries/integrations"
import { subscriptionsQueryOptions } from "@/queries/subscriptions"
import { useQuery } from "@tanstack/react-query"

export const useSubscriptions = (token: string) => {
  return useQuery(subscriptionsQueryOptions(token));
}

export const useIntegrations = (token: string) => {
  return useQuery(integrationsQueryOptions(token));
}


