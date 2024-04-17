import Head from 'next/head'

export interface TitleProps {
  text: string
}

export default function Title({ text }: TitleProps) {
  return (
    <Head>
      <title>{`${text} · Bailo`}</title>
    </Head>
  )
}
