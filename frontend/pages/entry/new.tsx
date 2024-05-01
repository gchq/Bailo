import { FileUpload } from '@mui/icons-material'
import { Button, Card, Container, Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import Title from 'src/common/Title'
import CreateEntry from 'src/entry/CreateEntry'
import { EntryKind, EntryKindKeys } from 'types/types'

export default function NewEntry() {
  const [entryKind, setEntryKind] = useState<EntryKindKeys | undefined>()

  return (
    <>
      <Title text='Create Entry' />
      <Container maxWidth='md'>
        {entryKind ? (
          <CreateEntry kind={entryKind} onBackClick={() => setEntryKind(undefined)} />
        ) : (
          <Card sx={{ p: 4, mb: 4 }}>
            <Stack spacing={4} justifyContent='center' alignItems='center'>
              <Typography variant='h6' component='h1' color='primary'>
                Create Entry
              </Typography>
              <FileUpload color='primary' fontSize='large' />
              <Stack
                direction={{ sm: 'column', md: 'row' }}
                spacing={4}
                justifyContent='center'
                alignItems='center'
                divider={<Divider orientation='vertical' flexItem />}
              >
                <Card
                  variant='outlined'
                  sx={{
                    width: '300px',
                    p: 2,
                  }}
                >
                  <Stack spacing={2}>
                    <Typography component='h2' variant='h6' color='primary'>
                      Create Model
                    </Typography>
                    <Typography>
                      Creating a model allows you to create artefacts and images, write a model card and control who has
                      access over your model. Use it when you have used training data to create a model, or are using a
                      model from another source.
                    </Typography>
                    <Button
                      variant='contained'
                      onClick={() => setEntryKind(EntryKind.MODEL)}
                      sx={{ width: '100%' }}
                      data-test='createModelButton'
                    >
                      Create
                    </Button>
                  </Stack>
                </Card>
                <Card
                  sx={{
                    width: '300px',
                    p: 2,
                  }}
                >
                  <Stack spacing={2}>
                    <Typography component='h2' variant='h6' color='primary'>
                      Create Data Card
                    </Typography>
                    <Typography>
                      Data cards allow you to track and reference the training data used to generate your models. Adding
                      data cards to Bailo allows you to link it to any model, keep track of its storage location and
                      other accreditation requirements.
                    </Typography>
                    <Button
                      variant='contained'
                      onClick={() => setEntryKind(EntryKind.DATA_CARD)}
                      sx={{ width: '100%' }}
                      data-test='createDataCardButton'
                    >
                      Create
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Card>
        )}
      </Container>
    </>
  )
}
