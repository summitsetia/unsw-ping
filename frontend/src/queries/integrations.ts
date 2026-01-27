import { getGoogleCalendarIntegration } from "@/api/integrations"
import { queryOptions } from "@tanstack/react-query"

export const integrationsQueryOptions = (token: string) => {
  return queryOptions({
    queryKey: ["integrations", token],
    queryFn: () => getGoogleCalendarIntegration(token),
    enabled: !!token,
  })
}