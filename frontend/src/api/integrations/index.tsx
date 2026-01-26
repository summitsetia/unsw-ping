import client from "../../lib/axiosClient"

export const getGoogleCalendarIntegration = async (token: string) => {
  const { data } = await client.get(`/api/me/integrations`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  console.log(data)
  return data;
}