import { useGetCurrentUser } from '@/data/user'
import Wrapper from '@/src/Wrapper'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import SchemaDesigner from '@/src/SchemaDesign/SchemaDesigner'
import { useEffect, useState } from 'react'
import { Schema, SplitSchema } from '@/types/interfaces'
import { getStepsFromSchema } from '@/utils/formUtils'
import FormDesigner from '@/src/Form/FormDesigner'
import Paper from '@mui/material/Paper'
import useNotification from '@/src/common/Snackbar'

export default function DesignSchema() {
  const [userSchema, setUserSchema] = useState<Schema | undefined>()
  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })

  const { currentUser } = useGetCurrentUser()
  const sendNotification = useNotification()

  useEffect(() => {
    if (!userSchema) return
    const { reference } = userSchema
    const steps = getStepsFromSchema(userSchema, {}, [])
    setSplitSchema({ reference, steps })
  }, [userSchema])

  useEffect(() => {
    console.log(splitSchema)
  }, [splitSchema])

  const onSubmit = () => {
    sendNotification({ variant: 'success', msg: 'Model submitted!' })
  }

  return (
    <Wrapper title='Design Schema' page='design'>
      <Box display='flex'>
        {currentUser && currentUser.roles.includes('admin') ? (
          <Box>
            <Stack direction='row' spacing={2}>
              <Box>
                <SchemaDesigner setUserSchema={setUserSchema} />
              </Box>
              <Box>
                <Paper
                  sx={{
                    p: 2,
                    width: '100%',
                  }}
                >
                  <FormDesigner
                    splitSchema={splitSchema}
                    setSplitSchema={setSplitSchema}
                    onSubmit={onSubmit}
                    modelUploading={false}
                  />
                </Paper>
              </Box>
            </Stack>
          </Box>
        ) : (
          <Typography variant='h5' component='p'>
            Error: You are not authorised to view this page.
          </Typography>
        )}
      </Box>
    </Wrapper>
  )
}
