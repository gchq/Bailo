import Head from 'next/head'

export interface TitleProps {
  title: string
}

export default function Title({ title }: TitleProps) {
  return (
    <Head>
      <title>{`${title} | Bailo`}</title>
    </Head>
  )
}
