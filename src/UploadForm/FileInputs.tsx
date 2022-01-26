import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/system'

const Input = styled('input')({
  display: 'none',
})

export default function VersionInput( editMode, { codeFile, onCodeFileChange, binaryFile, onBinaryFileChange }: any) {
  return (
    <Grid item xs={12} sm={12}>
      <Stack direction='row' spacing={2} alignItems='center'>
        <label htmlFor='code-file'>
          <Input id='code-file' type='file' onChange={onCodeFileChange} />
          <Button disabled={editMode} variant='outlined' component='span'>
            Select Code
          </Button>
        </label>
        {codeFile && <Typography variant='body2'>{codeFile.name}</Typography>}
        <label htmlFor='binary-file'>
          <Input disabled={editMode} id='binary-file' type='file' onChange={onBinaryFileChange} />
          <Button disabled={editMode} variant='outlined' component='span'>
            Select Binary
          </Button>
        </label>
        {binaryFile && <Typography variant='body2'>{binaryFile.name}</Typography>}
      </Stack>
    </Grid>
  )
}
