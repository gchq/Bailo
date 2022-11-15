import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import NavBar from '../components/NavBar'

export default function Home() {
  return (
    <>
      <NavBar />
      <Container maxWidth='lg'>
        <Typography gutterBottom sx={{ pt: 4 }}>
          Add content at some point
        </Typography>
      </Container>
    </>
  )
}
