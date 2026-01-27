import client from "../../lib/axiosClient"

export const getGoogleCalendarIntegration = async (token: string): Promise<{ connected: boolean }> => {
  const { data } = await client.get(`/api/me/integrations`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  return data;
}