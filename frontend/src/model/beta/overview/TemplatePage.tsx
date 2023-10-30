import { PostAdd } from '@mui/icons-material'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'

import { ModelInterface } from '../../../../types/v2/types'

type TemplatePageProps = {
  model: ModelInterface
}

export default function TemplatePage({ model }: TemplatePageProps) {
  const theme = useTheme()
  const router = useRouter()

  function handleCreateFromScratchClick() {
    router.push(`/beta/model/${model.id}/schema`)
  }

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', my: 4 }}>
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
          <Box
            sx={{
              border: 'solid 2px',
              borderColor: theme.palette.primary.main,
              p: 4,
              borderRadius: 2,
              width: '300px',
            }}
          >
            <Stack spacing={2}>
              <Typography component='h3' variant='h6'>
                Create from a template
              </Typography>
              <Typography variant='body1'>Create a model using an existing model as a template.</Typography>
              <Button variant='contained' disabled>
                Create
              </Button>
            </Stack>
          </Box>
          <Box
            sx={{
              border: 'solid 2px',
              borderColor: theme.palette.primary.main,
              p: 4,
              borderRadius: 2,
              width: '300px',
            }}
          >
            <Stack spacing={2}>
              <Typography component='h3' variant='h6'>
                Create from scratch
              </Typography>
              <Typography variant='body1'>Create a model from scratch using a predefined schema.</Typography>
              <Button variant='contained' onClick={handleCreateFromScratchClick}>
                Create
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}
