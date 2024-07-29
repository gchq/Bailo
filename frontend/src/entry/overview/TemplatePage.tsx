import { PostAdd } from '@mui/icons-material'
import { Box, Button, Card, Divider, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import Link from 'src/Link'
import { EntryCardKindLabel, EntryInterface, EntryKind } from 'types/types'
import { toTitleCase } from 'utils/stringUtils'

type TemplatePageProps = {
  entry: EntryInterface
}

export default function TemplatePage({ entry }: TemplatePageProps) {
  const entryCardDescription = useMemo(() => {
    switch (entry.kind) {
      case EntryKind.MODEL:
        return 'Model cards are required to ensure that our models are ethical, secure and effective. A model card is a living document, it lives with your code and will evolve over time.'
      case EntryKind.DATA_CARD:
        return 'Data cards allow you to track and reference the training data used to generate your models. Adding data cards to Bailo allows you to link it to any model, keep track of its storage location and other accreditation requirements.'
      default:
        return ''
    }
  }, [entry.kind])

  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto', my: 4 }}>
      <Stack spacing={4} justifyContent='center' alignItems='center'>
        <Typography component='h2' variant='h6' color='primary' data-test='createEntryCardOverview'>
          {`Create a ${toTitleCase(EntryCardKindLabel[entry.kind])}`}
        </Typography>
        <PostAdd fontSize='large' color='primary' />
        <Typography variant='body1'>{entryCardDescription}</Typography>
        <Stack
          direction={{ sm: 'column', md: 'row' }}
          spacing={4}
          justifyContent='center'
          alignItems='center'
          divider={<Divider orientation='vertical' flexItem />}
        >
          {entry.kind === EntryKind.MODEL && (
            <Card
              sx={{
                width: '300px',
                p: 2,
              }}
            >
              <Stack spacing={2}>
                <Typography component='h3' variant='h6' color='primary'>
                  Create from a template
                </Typography>
                <Typography>Create a model card using an existing model as a template.</Typography>
                <Button
                  sx={{ width: '100%' }}
                  variant='contained'
                  href={`/${entry.kind}/${entry.id}/template`}
                  LinkComponent={Link}
                  disabled={!!entry.settings.mirror?.sourceModelId}
                >
                  Create
                </Button>
              </Stack>
            </Card>
          )}
          <Card
            sx={{
              width: '300px',
              p: 2,
            }}
          >
            <Stack spacing={2}>
              <Typography component='h3' variant='h6' color='primary'>
                Create from scratch
              </Typography>
              <Typography>
                Create a {`${EntryCardKindLabel[entry.kind]}`} from scratch using a predefined schema.
              </Typography>
              <Button
                href={`/${entry.kind}/${entry.id}/schema`}
                LinkComponent={Link}
                variant='contained'
                sx={{ width: '100%' }}
                data-test='createSchemaFromScratchButton'
                disabled={!!entry.settings.mirror?.sourceModelId}
              >
                Create
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Box>
  )
}
