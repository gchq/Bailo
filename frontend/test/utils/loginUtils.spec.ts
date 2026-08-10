import { getLoginUrl } from 'utils/loginUtils'
import { describe, expect, it } from 'vitest'

describe('login utils', () => {
  it('includes the current path, query string, and fragment in the login URL', () => {
    const url = getLoginUrl({
      pathname: '/model/example',
      search: '?tab=files',
      hash: '#content',
    })

    expect(url).toBe('/api/login?redirect=%2Fmodel%2Fexample%3Ftab%3Dfiles%23content')
  })

  it('uses the home page when it is the current location', () => {
    const url = getLoginUrl({
      pathname: '/',
      search: '',
      hash: '',
    })

    expect(url).toBe('/api/login?redirect=%2F')
  })
})
