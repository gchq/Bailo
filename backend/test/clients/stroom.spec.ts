import { describe, expect, test, vi } from 'vitest'

import { sendEvents } from '../../src/clients/stroom.js'

vi.mock('../../../src/utils/config.js')

const fetchMock = vi.hoisted(() => ({
  default: vi.fn(() => ({})),
}))
vi.mock('node-fetch', async () => fetchMock)

const fsMock = vi.hoisted(() => ({
  readFile: vi.fn(),
}))
vi.mock('fs/promises', async () => ({ default: fsMock }))

const httpService = vi.hoisted(() => ({
  getHttpsAgent: vi.fn(),
}))
vi.mock('../../src/services/http.js', async () => httpService)

describe('clients > stroom', () => {
  // string generator to be configged
  const events =
    '<?xml version="1.0"?><Events xmlns="file://xml/schema/accounting/events" xmlns:stroom="stroom" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="file://xml/schema/accounting/events file://events-v3.5.0.xsd" Version="3.5.0"><Event><EventTime><TimeCreated>2024-02-06T14:15:08.048Z</TimeCreated></EventTime><EventSource><System><Name>bailo</Name><Environment>local</Environment></System><Generator>Generator</Generator><Device><IPAddress>172.26.0.7</IPAddress></Device><Client><IPAddress>172.26.0.1</IPAdresss></Client><User><Id>dn=Joe Bloggs</Id></User></EventSource><EventDetail><TypeId>ViewUserToken</TypeId><View><Object><Id>tjbu90c78o</Id><Name>token</Name><Description>Token Viewed</Description></Object></View></EventDetail></Event></Events>'
  test('sendEvents > success', async () => {
    const body = 'success'
    fetchMock.default.mockReturnValueOnce({
      ok: true,
      body,
    })

    const resp = await sendEvents(events)

    expect(fetchMock.default).toBeCalled()
    expect(resp).toBe(body)
  })

  test('sendEvents > bad 200 response', async () => {
    const body = 'bad'
    fetchMock.default.mockReturnValueOnce({
      ok: false,
      body,
    })

    const resp = sendEvents(events)

    expect(resp).rejects.toThrowError(`Failed to send logs to STROOM - Non-200 response`)
    expect(fetchMock.default).not.toBeCalled()
  })
})
