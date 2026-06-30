import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import React, { ReactNode } from 'react'

interface IntroCardProps {
  title: string
  user: string
  url: string
  children: ReactNode
}

export default function IntroCard({ title, user, url, children }: IntroCardProps) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant='h5' component='div'>
          {title}
        </Typography>
        <Typography
          component='div'
          sx={{
            color: 'text.secondary',
            mb: 1.5,
          }}
        >
          {user}
        </Typography>
        <Typography variant='body2' component='div'>
          {children}
        </Typography>
      </CardContent>
      <CardActions>
        <Link passHref href={url}>
          <Button size='small'>Learn More</Button>
        </Link>
      </CardActions>
    </Card>
  )
}
