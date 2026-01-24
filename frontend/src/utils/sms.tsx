export const smsLink = (phone: string, message: string) => {
  const body = encodeURIComponent(message)

  const userAgent = navigator.userAgent
  const isAndroid = userAgent.includes('Android')
  const isIOS = userAgent.includes('iPhone') || userAgent.includes('iPad')
  const isDesktop = !isAndroid && !isIOS

  if (isDesktop) {
    return `sms:${phone}?body=${body}`
  } else if (isAndroid) {
    return `sms:${phone}?body=${body}`
  } else if (isIOS) {
    return `sms:${phone}&body=${body}`
  }
}