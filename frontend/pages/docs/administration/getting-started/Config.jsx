import { compile, run } from '@mdx-js/mdx'
import { Box } from '@mui/material'
import { repeat } from 'lodash-es'
import { Fragment, useEffect, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import Loading from 'src/common/Loading'
import ErrorWrapper from 'src/errors/ErrorWrapper'

import { useGetConfigDocs } from '../../../../actions/uiConfig'

async function mdx(text) {
  return await run(
    String(
      await compile(text, {
        outputFormat: 'function-body',
      }),
    ),
    { ...runtime, baseUrl: import.meta.url },
  )
}

function Property({ name, type, doc, children, level = 0, nameStack = '' }) {
  const [mdxModule, setMdxModule] = useState()
  const Content = mdxModule ? mdxModule.default : Fragment
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const text =
        children?.length === 0
          ? `${repeat('> ', level)}**[${name}](#${nameStack})**: **\`${doc ? type : ''}\`**${doc ? ` - ${doc}` : ''}<br/>\n`
          : `${doc ? `${doc.replaceAll(/^/gm, repeat('> ', level))}` : ''}<br/>\n**[${name}](#${nameStack})**<br/>\n`

      const mdxResult = await mdx(text)
      if (!cancelled) {
        setMdxModule(mdxResult)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [children?.length, doc, level, name, nameStack, type])

  nameStack = nameStack ? `${nameStack}-${name}` : name
  if (children?.length === 0) {
    return (
      <Box sx={{ scrollMarginTop: 100 }} id={nameStack}>
        <Content />
      </Box>
    )
  } else {
    return (
      <Box sx={{ scrollMarginTop: 100 }} id={nameStack}>
        <Content />
        {children?.map((child) => (
          <Property
            key={child.name}
            name={child.name}
            type={child.type}
            doc={child.doc}
            level={level + 1}
            nameStack={nameStack}
          >
            {child.children}
          </Property>
        ))}
      </Box>
    )
  }
}

export default function Config() {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetConfigDocs()

  if (isUiConfigError) {
    return <ErrorWrapper message={isUiConfigError.info.message} />
  }

  if (isUiConfigLoading) {
    return <Loading />
  }

  return (
    <>
      {uiConfig &&
        uiConfig.map((property) => (
          <Property key={property.name} name={property.name} type={property.type} doc={property.doc}>
            {property.children}
          </Property>
        ))}
    </>
  )
}
