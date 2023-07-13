import { PostAdd } from '@mui/icons-material'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Overview({ model }: { model: any }) {
  const theme = useTheme()
  const router = useRouter()

  const [showTemplatePage, setShowTemplatePage] = useState(false)
  const [showFormPage, setShowFormPage] = useState(false)

  useEffect(() => {
    if (!model.schema) {
      displayTemplatePage()
    } else {
      displayFormPage()
    }
  }, [model])

  function createFromScratchOnClick() {
    router.push(`/beta/model/new/schema?modelUuid=${model.uuid}`)
  }

  function displayTemplatePage() {
    setShowTemplatePage(true)
    setShowFormPage(false)
  }

  function displayFormPage() {
    setShowTemplatePage(false)
    setShowFormPage(true)
  }

  return (
    <>
      {showTemplatePage && (
        <Box sx={{ maxWidth: '750px', mx: 'auto', my: 4 }}>
          <Stack spacing={4} justifyContent='center' alignItems='center'>
            <Typography variant='h6' color='primary'>
              Create a model card
            </Typography>
            <PostAdd fontSize='large' color='primary' />
            <Typography variant='body1'>
              Model cards are required to ensure that our models are ethical, secure and effective. A model card is a
              living document, it lives with your code and will evolve over time.
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
                  <Typography variant='h6'>Create from a template</Typography>
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
                  <Typography variant='h6'>Create from scratch</Typography>
                  <Typography variant='body1'>Create a model from scratch using a predifined schema.</Typography>
                  <Button variant='contained' onClick={createFromScratchOnClick}>
                    Create
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Box>
      )}
      {showFormPage && <>This is the model overview page</>}
    </>
  )
}
