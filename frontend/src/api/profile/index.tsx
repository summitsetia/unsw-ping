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

export const updateProfile = async (token: string, name: string) => {
  const { data } = await client.put(`/api/me/profile`, {
    name,
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  return data;
}

export const deleteAccount = async (token: string) => {
  const { data } = await client.delete(`/api/me/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  return data;
}