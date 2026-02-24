import { Box } from '@mui/material'
import { useMemo } from 'react'

import MarkdownDisplay from '../common/MarkdownDisplay'

export default function ConfigProperty({ name, type, doc, children, level = 0, nameStack = '' }) {
  const newNameStack = nameStack ? `${nameStack}-${name}` : name

  const text = useMemo(
    () =>
      children?.length === 0
        ? `${'> '.repeat(level)}**[${name}](#${newNameStack})**: **\`${doc ? type : ''}\`**${doc ? ` - ${doc}` : ''}<br/>\n`
        : `${doc ? `${doc.replaceAll(/^/gm, '> '.repeat(level))}` : ''}<br/>\n**[${name}](#${newNameStack})**<br/>\n`,
    [children?.length, doc, level, name, newNameStack, type],
  )

  if (children?.length === 0) {
    return (
      <Box sx={{ scrollMarginTop: 100 }} id={newNameStack}>
        <MarkdownDisplay>{text}</MarkdownDisplay>
      </Box>
    )
  } else {
    return (
      <Box sx={{ scrollMarginTop: 100 }} id={newNameStack}>
        <MarkdownDisplay>{text}</MarkdownDisplay>
        {children?.map((child) => (
          <ConfigProperty
            key={child.name}
            name={child.name}
            type={child.type}
            doc={child.doc}
            level={level + 1}
            nameStack={newNameStack}
          >
            {child.children}
          </ConfigProperty>
        ))}
      </Box>
    )
  }
}
