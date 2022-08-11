import Wrapper from 'src/Wrapper'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import BugReportIcon from '@mui/icons-material/BugReportTwoTone'
import ArticleIcon from '@mui/icons-material/ArticleTwoTone'
import ContactSupportIcon from '@mui/icons-material/ContactSupportTwoTone'
import useTheme from '@mui/styles/useTheme'
import MultipleErrorWrapper from '../src/errors/MultipleErrorWrapper'
import { useGetUiConfig } from '../data/uiConfig'
import { lightTheme } from '../src/theme'

export default function Help() {
  const { uiConfig, isUiConfigError } = useGetUiConfig()

  const theme: any = useTheme() || lightTheme

  const error = MultipleErrorWrapper(`Unable to load help page`, {
    isUiConfigError,
  })
  if (error) return error

  return (
    <Wrapper title='Help' page='help'>
      {uiConfig && (
        <>
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant='h2'>Contact us</Typography>
          </Box>
          <Grid container spacing={4} sx={{ maxWidth: 1000, margin: 'auto', pr: 4 }}>
            <Grid item xs={12} sm={12} md={12} lg={4}>
              <Card sx={{ textAlign: 'center', margin: 'auto', width: 300 }}>
                <CardContent sx={{ height: 320 }}>
                  <BugReportIcon
                    sx={{ pt: 2, fontSize: 75 }}
                    color={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
                  />
                  <Typography sx={{ p: 2 }} variant='h4'>
                    Bug reports
                  </Typography>
                  <Typography sx={{ p: 2, mb: 1.5 }} variant='body1' component='p'>
                    If you have experienced any issues with Bailo, then please report it to the {uiConfig.issues?.label}
                    .
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant='contained'
                    href={uiConfig.issues?.supportHref}
                    sx={{ margin: 'auto', mb: 1.5, width: 200 }}
                  >
                    Raise ticket
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={4}>
              <Card sx={{ textAlign: 'center', margin: 'auto', width: 300 }}>
                <CardContent sx={{ height: 320 }}>
                  <ArticleIcon
                    sx={{ pt: 2, fontSize: 75 }}
                    color={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
                  />
                  <Typography sx={{ p: 2 }} variant='h4'>
                    Documentation
                  </Typography>
                  <Typography sx={{ p: 2, mb: 1.5 }} variant='body1' component='p'>
                    To find out more about Bailo please see our documentation pages.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant='contained'
                    href={uiConfig.help?.documentationUrl}
                    sx={{ margin: 'auto', mb: 1.5, width: 200 }}
                  >
                    View documentation
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={4}>
              <Card sx={{ textAlign: 'center', margin: 'auto', width: 300 }}>
                <CardContent sx={{ height: 320 }}>
                  <ContactSupportIcon
                    sx={{ pt: 2, fontSize: 75 }}
                    color={theme.palette.mode === 'light' ? 'primary' : 'secondary'}
                  />
                  <Typography sx={{ p: 2 }} variant='h4'>
                    Get in touch
                  </Typography>
                  <Typography sx={{ p: 2, mb: 1.5 }} variant='body1' component='p'>
                    If you have a general query and need to get in touch, please do so below.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant='contained'
                    href={uiConfig.issues?.contactHref}
                    sx={{ margin: 'auto', mb: 1.5, width: 200 }}
                  >
                    Get support
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Wrapper>
  )
}
