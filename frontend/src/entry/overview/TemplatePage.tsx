import { PostAdd } from '@mui/icons-material'
import { Box, Button, Card, Divider, Stack, Typography } from '@mui/material'
import Link from 'src/Link'
import { EntryInterface } from 'types/types'

type TemplatePageProps = {
  entry: EntryInterface
}

export default function TemplatePage({ entry }: TemplatePageProps) {
  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto', my: 4 }}>
      <Stack spacing={4} justifyContent='center' alignItems='center'>
        <Typography component='h2' variant='h6' color='primary' data-test='createModelCardOverview'>
          Create a model card
        </Typography>
        <PostAdd fontSize='large' color='primary' />
        <Typography variant='body1'>
          Model cards are required to ensure that our models are ethical, secure and effective. A model card is a living
          document, it lives with your code and will evolve over time.
        </Typography>
        <Stack
          direction={{ sm: 'column', md: 'row' }}
          spacing={4}
          justifyContent='center'
          alignItems='center'
          divider={<Divider orientation='vertical' flexItem />}
        >
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
              <Typography>Create a model using an existing model as a template.</Typography>
              <Button sx={{ width: '100%' }} variant='contained' disabled>
                Create
              </Button>
            </Stack>
          </Card>
          <Card
            variant='outlined'
            sx={{
              width: '300px',
              p: 2,
            }}
          >
            <Stack spacing={2}>
              <Typography component='h3' variant='h6' color='primary'>
                Create from scratch
              </Typography>
              <Typography>Create a model from scratch using a predefined schema.</Typography>
              <Button
                href={`/model/${entry.id}/schema`}
                LinkComponent={Link}
                variant='contained'
                sx={{ width: '100%' }}
                data-test='createSchemaFromScratchButton'
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
