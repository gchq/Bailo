import BugReportIcon from '@mui/icons-material/BugReport'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Container, Divider, Paper, Stack } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useContext } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Title from 'src/common/Title'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { faqItems, relatedDocs } from 'src/help/troubleshootingFaq'
import Link from 'src/Link'

export default function Help() {
  const uiConfig = useContext(UiConfigContext)

  return (
    <Container maxWidth='xl' sx={{ pb: 2 }}>
      <Title text='Help' />
      <Paper sx={{ py: 5, px: 5 }}>
        <Stack direction={{ md: 'row', sm: 'column' }} divider={<Divider flexItem orientation='vertical' />}>
          <Box sx={{ textAlign: 'center', margin: 'auto', maxWidth: 550, minHeight: '320px' }}>
            <BugReportIcon sx={{ pt: 2, fontSize: 75 }} color='primary' />
            <Typography sx={{ p: 2 }} variant='h4' component='h2' color='primary'>
              Bug reports
            </Typography>
            <Typography sx={{ p: 2, mb: 1 }} variant='body1' component='p'>
              If you have experienced any issues with Bailo, then please report it to the {uiConfig.issues?.label}.
            </Typography>
            <Button variant='contained' href={uiConfig.issues?.supportHref} sx={{ mx: 'auto', mb: 2, width: 200 }}>
              Raise ticket
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center', margin: 'auto', maxWidth: 550, minHeight: '320px' }}>
            <ContactSupportIcon sx={{ pt: 2, fontSize: 75 }} color='primary' />
            <Typography sx={{ p: 2 }} variant='h4' component='h2' color='primary'>
              Get in touch
            </Typography>
            <Typography sx={{ p: 2, mb: 1 }} variant='body1' component='p'>
              If you have a general query and need to get in touch, please do so below.
            </Typography>
            <Button variant='contained' href={uiConfig.issues?.contactHref} sx={{ mx: 'auto', mb: 2, width: 200 }}>
              Get support
            </Button>
          </Box>
        </Stack>
      </Paper>
      <Paper sx={{ mt: 2, py: 5, px: 5 }}>
        <Typography variant='h4' component='h2' color='primary'>
          Troubleshooting and FAQ
        </Typography>
        <Typography sx={{ pt: 1, pb: 3 }} color='text.secondary'>
          Common issues and answers for Bailo users and administrators.
        </Typography>
        <Box>
          {faqItems.map((item) => (
            <Accordion
              key={item.question}
              disableGutters
              variant='outlined'
              slotProps={{ heading: { component: 'h3' } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 'bold' }}>{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MarkdownDisplay>{item.answer}</MarkdownDisplay>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        <Divider sx={{ my: 4 }} />
        <Typography variant='h6' component='h3' gutterBottom>
          Related documentation
        </Typography>
        <Stack direction='row' spacing={3} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {relatedDocs.map((doc) => (
            <Link key={doc.href} href={doc.href}>
              {doc.title}
            </Link>
          ))}
        </Stack>
      </Paper>
    </Container>
  )
}
