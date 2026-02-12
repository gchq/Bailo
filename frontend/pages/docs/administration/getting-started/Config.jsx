import { compile, run } from '@mdx-js/mdx'
import { Fragment, useEffect, useState } from 'react'
import * as runtime from 'react/jsx-runtime'
import { useGetConfigDocs } from '../../../../actions/uiConfig'
import Loading from 'src/common/Loading'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import { repeat } from 'lodash-es'
import { Box } from '@mui/material'

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
  useEffect(function () {
    ;(async function () {
      setMdxModule(
        await mdx(
          children?.length === 0
            ? `${repeat('> ', level)}**[${name}](#${nameStack})**: **\`${doc ? type : ''}\`**${doc ? ` - ${doc}` : ''}<br/>\n`
            : ` ${doc ? `${doc.replaceAll(/^/gm, repeat('> ', level))}` : ''}<br/>\n**[${name}](#${nameStack})**<br/>\n`,
        ),
      )
    })()
  }, [])
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
            name={child.name}
            type={child.type}
            doc={child.doc}
            children={child.children}
            level={level + 1}
            nameStack={nameStack}
          />
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
  console.log(uiConfig)

  return (
    <>
      {uiConfig &&
        uiConfig.map((property) => (
          <Property name={property.name} type={property.type} doc={property.doc} children={property.children} />
        ))}
    </>
  )
}
