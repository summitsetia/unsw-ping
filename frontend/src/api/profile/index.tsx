import client from "../../lib/axiosClient"

export const getProfile = async (token: string) => {
  const { data } = await client.get(`/api/me/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  console.log(data)
  return data;
}