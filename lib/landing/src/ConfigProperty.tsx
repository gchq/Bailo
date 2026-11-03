import { Box, Link, Paper, Typography } from '@mui/material'
import { useMemo } from 'react'

import MarkdownDisplay from '../src/common/MarkdownDisplay'

export default function ConfigProperty({ name, type, doc, children, level = 0, nameStack = '' }) {
  const newNameStack = nameStack ? `${nameStack}-${name}` : name

  // Strip leading markdown headings to avoid duplicate visible titles
  const cleanedDoc = useMemo(() => doc?.replace(/^#{1,6}\s+.*$/m, '').trim(), [doc])

  const leafText = useMemo(() => `**\`${type}\`**${cleanedDoc ? ` - ${cleanedDoc}` : ''}`, [cleanedDoc, type])

  return (
    <Paper
      id={newNameStack}
      variant='outlined'
      sx={{
        scrollMarginTop: 100,
        mb: 2,
        ml: level * 2,
        p: 2,
        borderColor: 'markdownBorder.main',
        backgroundColor: 'container.main',
      }}
    >
      <Typography variant='subtitle1' fontWeight='bold'>
        <Link href={`#${newNameStack}`} underline='hover' color='inherit'>
          {name}
        </Link>
      </Typography>
      {children?.length === 0 ? (
        <MarkdownDisplay>{leafText}</MarkdownDisplay>
      ) : (
        <>
          {cleanedDoc && <MarkdownDisplay>{cleanedDoc}</MarkdownDisplay>}
          <Box mt={1}>
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
        </>
      )}
    </Paper>
  )
}
