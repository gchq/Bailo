import { Box, Typography } from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import { Fragment, type ReactNode } from 'react'
import { type DiffChunk } from 'src/common/InlineDiff/diffEngine'
import { type MediaKind } from 'utils/markdownUtils'

type Props = {
  operation: 'insert' | 'delete'
  children: ReactNode
  block?: boolean
  media?: MediaKind
}

// Explicit pixel units are required - in MUI `sx`, a sizing value of 1 means 100% rather than 1px
const visuallyHidden = {
  border: 0,
  clipPath: 'inset(50%)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const

const forcedColours = {
  '@media (forced-colors: active)': {
    color: 'CanvasText',
    backgroundColor: 'Canvas',
    outline: '1px solid CanvasText',
  },
}

// A grid column sizes itself to its widest content by default, so long code lines and tables would stretch the page.
// Capping the column at the available width lets that content scroll or wrap inside it instead.
export const stackedDiffLayout = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 0.5 } as const

function highlight(theme: Theme, inserted: boolean) {
  return alpha(inserted ? theme.palette.success.main : theme.palette.error.main, 0.2)
}

function MediaFrame({ media, children }: { media: MediaKind; inserted: boolean; children: ReactNode }) {
  const audio = media === 'audio'

  return (
    <Box
      component='span'
      data-diff-media-frame={media}
      sx={(theme) => ({
        display: 'flex',
        width: '100%',
        minWidth: 0,
        // Audio players have a fixed height, so only images and video are given a 16:9 frame
        aspectRatio: audio ? undefined : '16 / 9',
        padding: audio ? 1 : 0,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        margin: '2px',
        backgroundColor: 'background.paper',
        '& img, & video': { width: '100%', height: '100%', objectFit: 'contain' },
        '& audio': { width: '100%' },
        boxSizing: 'border-box',
        maxWidth: '100%',
        ...forcedColours,
        ...theme.applyStyles('dark', { backgroundColor: theme.palette.grey[900] }),
      })}
    >
      {children}
    </Box>
  )
}

// The marker is part of the changed-content box, rather than a separate column, so it cannot overflow its parent.
const MARKER_WIDTH = '20px'

function MarkerHeader({ inserted }: { inserted: boolean }) {
  return (
    <Box
      component='span'
      aria-hidden='true'
      data-diff-marker
      sx={(theme) => {
        const palette = inserted ? theme.palette.success : theme.palette.error

        return {
          display: 'block',
          boxSizing: 'border-box',
          width: MARKER_WIDTH,
          minHeight: '100%',
          padding: '2px 6px',
          color: palette.contrastText,
          backgroundColor: alpha(palette.main, 0.4),
          fontSize: '14px',
          fontWeight: 700,
          lineHeight: '20px',
          textAlign: 'left',
          userSelect: 'none',
          '@media (forced-colors: active)': { color: 'CanvasText', backgroundColor: 'Canvas' },
        }
      }}
    >
      {inserted ? '+' : '-'}
    </Box>
  )
}

export default function DiffMark({ operation, children, block = false, media }: Props) {
  const inserted = operation === 'insert'

  return (
    <Box
      component={inserted ? 'ins' : 'del'}
      data-diff-media={media}
      data-diff-operation={operation}
      sx={(theme) => ({
        display: block || media ? 'flex' : 'inline-flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        minWidth: 0,
        maxWidth: '100%',
        width: media ? 'min(100%, 32rem)' : block ? '100%' : 'fit-content',
        verticalAlign: block || media ? 'top' : 'middle',
        color: 'inherit',
        font: 'inherit',
        textDecoration: 'none',
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        borderRadius: 1,
        backgroundColor: highlight(theme, inserted),
        margin: media ? 0.3 : 0,
        ...forcedColours,
      })}
    >
      <MarkerHeader inserted={inserted} />
      <Box
        component='span'
        sx={{
          display: 'block',
          flex: 1,
          minWidth: 0,
          maxWidth: '100%',
          padding: block || media ? '2px 8px' : '0 6px',
        }}
      >
        <Box component='span' sx={visuallyHidden}>
          {inserted ? 'Inserted content: ' : 'Deleted content: '}
        </Box>
        {media ? (
          <MediaFrame media={media} inserted={inserted}>
            {children}
          </MediaFrame>
        ) : (
          children
        )}
      </Box>
    </Box>
  )
}

export function DiffChunks({ chunks }: { chunks: DiffChunk<string>[] }) {
  return chunks.map((chunk, index) =>
    chunk.operation === 'equal' ? (
      <Fragment key={index}>{chunk.value}</Fragment>
    ) : (
      <DiffMark key={index} operation={chunk.operation}>
        {chunk.value}
      </DiffMark>
    ),
  )
}

type WholeValueDiffProps = {
  from: string
  to: string
  render: (value: string) => ReactNode
}

function Unanswered() {
  return (
    <Typography
      component='span'
      data-test='diff-unanswered'
      sx={{ color: 'customTextInput.main', fontStyle: 'italic' }}
    >
      Unanswered
    </Typography>
  )
}

/** Renders a value that is unchanged, or that was added or removed entirely, so no word-level diff is needed. */
export function WholeValueDiff({ from, to, render }: WholeValueDiffProps) {
  if (from === to) {
    return from ? render(from) : <Unanswered />
  }

  return (
    <Box data-diff-whole-value sx={stackedDiffLayout}>
      <DiffMark operation='delete' block>
        {from ? render(from) : <Unanswered />}
      </DiffMark>
      <DiffMark operation='insert' block>
        {to ? render(to) : <Unanswered />}
      </DiffMark>
    </Box>
  )
}
