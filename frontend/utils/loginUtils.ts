type LoginLocation = Pick<Location, 'pathname' | 'search' | 'hash'>

export const getLoginUrl = (location: LoginLocation) => {
  const redirect = `${location.pathname}${location.search}${location.hash}`
  return `/api/login?redirect=${encodeURIComponent(redirect)}`
}

export const redirectToLoginPage = () => {
  window.location.href = getLoginUrl(window.location)
}
