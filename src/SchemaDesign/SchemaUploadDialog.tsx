import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Link from '@mui/material/Link'
import { useState } from 'react'
import { SchemaType, SchemaTypes } from '@/types/interfaces'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import { postEndpoint } from '@/data/api'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import useNotification from '../common/Snackbar'

export default function SchemaUploadDialog({
  open,
  handleDialogClose,
}: {
  open: boolean
  handleDialogClose: () => void
}) {
  const sendNotification = useNotification()

  const [schema, setSchema] = useState('')
  const [schemaName, setSchemaName] = useState('')
  const [schemaReference, setSchemaReference] = useState('')
  const [schemaUse, setSchemaUse] = useState<SchemaType>(SchemaTypes.UPLOAD)
  const [filename, setFilename] = useState('')
  const [uploadErrorText, setUploadErrorText] = useState('')

  const handleUploadChange = (event) => {
    const fileReader = new FileReader()
    fileReader.readAsText(event.target.files[0], 'UTF-8')
    fileReader.onload = (onloadEvent) => {
      if (onloadEvent?.target?.result !== undefined && onloadEvent?.target?.result !== null) {
        setFilename(event.target.files[0].name)
        setSchema(onloadEvent.target.result.toString())
      }
    }
  }

  const submitForm = async (event) => {
    event.preventDefault()
    setUploadErrorText('')
    try {
      const parsedSchema = JSON.parse(schema)
      const data = {
        name: schemaName,
        reference: schemaReference,
        schema: parsedSchema,
        use: schemaUse,
      }
      await postEndpoint(`/api/v1/schema`, data)
        .then((res) => res.json())
        .then((res) => {
          if (res === schemaName) {
            sendNotification({ variant: 'success', msg: 'Schema uploaded' })
            setSchemaName('')
            setSchemaReference('')
            setSchemaUse(SchemaTypes.UPLOAD)
            setFilename('')
            handleDialogClose()
          } else {
            setUploadErrorText(res.message)
          }
        })
    } catch (error: any) {
      if (error.toString().includes('SyntaxError')) {
        setUploadErrorText('Error trying to parse JSON')
      }
    }
  }

  return (
    <Dialog open={open} onClose={handleDialogClose}>
      <DialogTitle>Upload a new schema</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ maxWidth: '400px' }}>
          <Typography variant='caption'>
            For more information on creating a schema yourself, please see
            <Link
              sx={{ pl: 0.5 }}
              target='_blank'
              href='/docs/administration/getting-started/configuration/making-a-schema'
            >
              the documentation
            </Link>
            .
          </Typography>
          <form onSubmit={submitForm}>
            <Stack spacing={2}>
              <TextField
                required
                label='Schema reference'
                onChange={(event): void => setSchemaReference(event.target.value)}
                value={schemaReference}
              />
              <TextField
                required
                label='Schema name'
                onChange={(event): void => setSchemaName(event.target.value)}
                value={schemaName}
              />
              <TextField
                select
                label='Schema Type'
                value={schemaUse}
                onChange={(event): void => setSchemaUse(event.target.value as SchemaType)}
              >
                <MenuItem value={SchemaTypes.UPLOAD}>Upload</MenuItem>
                <MenuItem value={SchemaTypes.DEPLOYMENT}>Deployment</MenuItem>
              </TextField>
              <Button variant='outlined' component='label'>
                {filename !== '' ? filename : 'Select schema'}
                <input type='file' hidden onChange={handleUploadChange} />
              </Button>
              <Box sx={{ textAlign: 'right' }}>
                <Button variant='contained' sx={{ maxWidth: '150px' }} type='submit'>
                  Submit
                </Button>
              </Box>
              <Typography variant='caption' color='error'>
                {uploadErrorText}
              </Typography>
            </Stack>
          </form>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
