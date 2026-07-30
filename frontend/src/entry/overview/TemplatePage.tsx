import Add from '@mui/icons-material/Add'
import PostAdd from '@mui/icons-material/PostAdd'
import { Box, Button, Card, Divider, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Restricted from 'src/common/Restricted'
import Link from 'src/Link'
import { EntryCardKindLabel, EntryInterface, EntryKind } from 'types/types'
import { entryKindForRedirect } from 'utils/routerUtils'
import { toTitleCase } from 'utils/stringUtils'

type TemplatePageProps = {
  entry: EntryInterface
}

export default function TemplatePage({ entry }: TemplatePageProps) {
  const entryCardDescription = useMemo(() => {
    switch (entry.kind) {
      case EntryKind.MODEL:
      case EntryKind.UNTRUSTED_MODEL:
        return 'Model cards are required to help ensure models are ethical, secure, and effective. A model card is a living document that evolves alongside the model and its associated code.'
      case EntryKind.DATA_CARD:
        return 'Data cards track and reference the training data used to generate models. They can be linked to models and used to record storage locations and accreditation-related information.'
      default:
        return ''
    }
  }, [entry.kind])

  return (
    <Restricted
      action='editEntry'
      fallback={
        <Box sx={{ mt: 4 }}>
          <EmptyBlob text={`No schema has been set for this ${toTitleCase(EntryCardKindLabel[entry.kind])}`} />
        </Box>
      }
    >
      <Box sx={{ maxWidth: 'md', mx: 'auto', my: 4 }}>
        <Stack
          spacing={4}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography component='h2' variant='h6' color='primary' data-test='createEntryCardOverview'>
            {`Create ${toTitleCase(EntryCardKindLabel[entry.kind])}`}
          </Typography>
          <PostAdd fontSize='large' color='primary' />
          <Typography variant='body1'>{entryCardDescription}</Typography>
          <Stack
            direction={{ sm: 'column', md: 'row' }}
            spacing={4}
            divider={<Divider orientation='vertical' flexItem />}
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Card
              sx={{
                width: '300px',
                p: 2,
              }}
            >
              <Stack spacing={2}>
                <Typography component='h3' variant='h6' color='primary'>
                  Create from schema
                </Typography>
                <Typography>
                  {`Create ${EntryCardKindLabel[entry.kind]} from scratch using a predefined schema.`}
                </Typography>
                <Button
                  href={`/${entryKindForRedirect(entry.kind)}/${entry.id}/schema`}
                  LinkComponent={Link}
                  variant='contained'
                  sx={{ width: '100%' }}
                  data-test='createSchemaFromScratchButton'
                  disabled={!!entry.settings.mirror?.sourceModelId}
                  startIcon={<Add />}
                >
                  Create
                </Button>
              </Stack>
            </Card>
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
                    href={`/${entryKindForRedirect(entry.kind)}/${entry.id}/template`}
                    LinkComponent={Link}
                    disabled={!!entry.settings.mirror?.sourceModelId}
                    startIcon={<Add />}
                  >
                    Create
                  </Button>
                </Stack>
              </Card>
            )}
          </Stack>
        </Stack>
      </Box>
    </Restricted>
  )
}
