import client from "../../lib/axiosClient"

export const getSubscriptions = async (token: string) => {
  const { data } = await client.get(`/api/me/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  console.log(data)
  return data
}

export const removeSubscription = async (token: string, societyName: string) => {
  const { data } = await client.delete(`/api/me/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    data: {
      societyName,
    },
  })
  console.log(data)
  return data
}

export const addSubscriptions = async (token: string, societyNames: string[]) => {
  const { data } = await client.post(
    "/api/me/subscriptions",
    { societyNames },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};
