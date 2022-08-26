import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Link from 'next/link'

interface IntroCardProps {
  title: string
  user: string
  children: any
  url: string
}

export default function IntroCard({ title, user, children, url }: IntroCardProps) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant='h5' component='div'>
          {title}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color='text.secondary'>
          {user}
        </Typography>
        <Typography variant='body2'>{children}</Typography>
      </CardContent>
      <CardActions>
        <Link href={url}>
          <Button size='small'>Learn More</Button>
        </Link>
      </CardActions>
    </Card>
  )
}
