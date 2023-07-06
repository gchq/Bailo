import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'

import { UiConfig } from '../types/types'

interface DefaultProps {
  config: UiConfig
}

export default async function getDefaultProps({
  req,
}: GetServerSidePropsContext): Promise<GetServerSidePropsResult<DefaultProps>> {
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const baseUrl = req ? `${protocol}://${req.headers.host}` : ''

  const config = await fetch(`${baseUrl}/api/v1/config/ui`).then((res) => res.json())

  return {
    props: {
      config,
    },
  }
}
