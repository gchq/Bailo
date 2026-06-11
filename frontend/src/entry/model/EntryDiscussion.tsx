import { Box, Container } from '@mui/material'
import ReviewComments from 'src/reviews/ReviewComments'
import { EntryInterface, ReviewKind } from 'types/types'

type EntryDiscussionProps = {
  entry: EntryInterface
  mutateEntry: () => void
}

export default function EntryDiscussion({ entry, mutateEntry }: EntryDiscussionProps) {
  return (
    <Container sx={{ my: 2 }}>
      <Box sx={{ mx: 'auto' }}>
        <ReviewComments
          parentId={entry['_id']}
          entryId={entry.id}
          kind={ReviewKind.LIFECYCLE}
          isEdit={false}
          mutator={mutateEntry}
        />
      </Box>
    </Container>
  )
}
