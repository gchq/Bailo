import { Box, Typography } from '@mui/material'
import { alpha, Theme } from '@mui/material/styles'
import { Fragment, ReactNode } from 'react'
import { DiffChunk } from 'src/common/InlineDiff/diffEngine'
import { MediaKind } from 'utils/markdownUtils'

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

function highlight(theme: Theme, inserted: boolean) {
  return alpha(inserted ? theme.palette.success.main : theme.palette.error.main, 0.3)
}

function MediaFrame({ media, inserted, children }: { media: MediaKind; inserted: boolean; children: ReactNode }) {
  const audio = media === 'audio'

  return (
    <Box
      component='span'
      data-diff-media-frame={media}
      sx={(theme) => ({
        display: 'flex',
        width: '100%',
        // Audio players have a fixed height, so only images and video are given a 16:9 frame
        aspectRatio: audio ? undefined : '16 / 9',
        padding: audio ? 1 : 0,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '3px solid',
        borderColor: inserted ? 'success.main' : 'error.main',
        borderRadius: 0.5,
        backgroundColor: 'background.paper',
        '& img, & video': { width: '100%', height: '100%', objectFit: 'contain' },
        '& audio': { width: '100%' },
        ...forcedColours,
        ...theme.applyStyles('dark', { backgroundColor: theme.palette.grey[900] }),
      })}
    >
      {children}
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
        color: 'inherit',
        font: 'inherit',
        textDecoration: 'none',
        overflowWrap: 'anywhere',
        margin: 0.3,
        ...(media
          ? {
              display: 'inline-flex',
              flexDirection: 'column',
              width: media === 'audio' ? '100%' : 'min(100%, 32rem)',
              verticalAlign: 'top',
            }
          : {
              display: block ? 'block' : 'inline',
              whiteSpace: block ? 'normal' : 'pre-wrap',
              paddingInline: '2px',
              borderRadius: 0.5,
              backgroundColor: highlight(theme, inserted),
            }),
        ...forcedColours,
      })}
    >
      <Box
        component='span'
        aria-hidden='true'
        sx={(theme) => ({
          fontWeight: 700,
          marginInlineEnd: '2px',
          ...(media && {
            alignSelf: 'flex-start',
            paddingInline: '6px',
            borderRadius: 0.5,
            marginBlockEnd: 0.5,
            backgroundColor: highlight(theme, inserted),
          }),
        })}
      >
        {inserted ? '+' : '-'}
      </Box>
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
    <Box sx={{ display: 'grid', gap: 0.5 }}>
      <DiffMark operation='delete' block>
        {from ? render(from) : <Unanswered />}
      </DiffMark>
      <DiffMark operation='insert' block>
        {to ? render(to) : <Unanswered />}
      </DiffMark>
    </Box>
  )
}
