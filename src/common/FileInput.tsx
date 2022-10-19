import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/system'

const Input = styled('input')({
  display: 'none',
})

const displayFilename = (filename: string) => {
  const parts = filename.split('.')
  const ext = parts.pop()
  const base = parts.join('.')
  return base.length > 12 ? `${base}...${ext}` : filename
}

export default function FileInput({
  label,
  onChange,
  file,
  accepts,
  disabled,
}: {
  label: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  file?: File
  accepts?: string
  disabled?: boolean
}) {
  const id = `${label.replace(/ /g, '-').toLowerCase()}-file`

  return (
    <>
      <label htmlFor={id}>
        <Input style={{ margin: '10px' }} id={id} type='file' onInput={onChange} accept={accepts} disabled={disabled} />
        <Button variant='outlined' component='span' disabled={disabled}>
          {label}
        </Button>
      </label>
      {file && <Typography variant='body2'>{displayFilename(file.name)}</Typography>}
    </>
  )
}
