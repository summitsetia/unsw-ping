import { integrationsQueryOptions } from "@/queries/integrations"
import { subscriptionsQueryOptions } from "@/queries/subscriptions"
import { userProfileQueryOptions } from "@/queries/user-profile";
import { useQuery } from "@tanstack/react-query"

export const useSubscriptions = (token: string) => {
  return useQuery(subscriptionsQueryOptions(token));
}

export const useIntegrations = (token: string) => {
  return useQuery(integrationsQueryOptions(token));
}

export const useUserProfile = (token: string) => {
  return useQuery(userProfileQueryOptions(token));
}


