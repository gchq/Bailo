import BugReportIcon from '@mui/icons-material/BugReport'
import ContactSupportIcon from '@mui/icons-material/ContactSupport'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Container, Paper, Stack } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useContext } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Title from 'src/common/Title'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { faqCategories, faqItems } from 'src/help/troubleshootingFaq'

export default function Help() {
  const uiConfig = useContext(UiConfigContext)

  return (
    <Container maxWidth='xl' sx={{ pb: 2 }}>
      <Title text='Help' />
      <Paper sx={{ mt: 2, py: 3, px: 3 }}>
        <Typography variant='h4' component='h2' color='primary'>
          Frequently Asked Questions
        </Typography>
        <Typography sx={{ pt: 0.5, pb: 2 }} color='text.secondary'>
          Common issues and answers for Bailo users and administrators.
        </Typography>
        {faqCategories.map((category) => (
          <Box key={category} sx={{ pb: 2 }}>
            <Typography variant='subtitle1' component='h3' sx={{ fontWeight: 'bold', pb: 1 }}>
              {category}
            </Typography>
            {faqItems
              .filter((item) => item.category === category)
              .map((item) => (
                <Accordion
                  key={item.question}
                  disableGutters
                  variant='outlined'
                  slotProps={{ heading: { component: 'h4' } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      px: 2,
                      '& .MuiAccordionSummary-content': { my: 1.5 },
                      '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold' }}>{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, pt: 0 }}>
                    <MarkdownDisplay>{item.answer}</MarkdownDisplay>
                  </AccordionDetails>
                </Accordion>
              ))}
          </Box>
        ))}
      </Paper>
      <Box sx={{ mt: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Paper variant='outlined' sx={{ p: 3, bgcolor: 'action.hover' }}>
          <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
            <BugReportIcon color='primary' sx={{ fontSize: 40 }} />
            <Typography variant='h5' component='h2' color='primary'>
              Bug reports
            </Typography>
            <Typography color='text.secondary' sx={{ pb: 1 }}>
              Report any issues with Bailo to the Bailo support team.
            </Typography>
            <Button variant='contained' href={uiConfig.issues?.supportHref}>
              Raise ticket
            </Button>
          </Stack>
        </Paper>
        <Paper variant='outlined' sx={{ p: 3, bgcolor: 'action.hover' }}>
          <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
            <ContactSupportIcon color='primary' sx={{ fontSize: 40 }} />
            <Typography variant='h5' component='h2' color='primary'>
              Get in touch
            </Typography>
            <Typography color='text.secondary' sx={{ pb: 1 }}>
              Contact the team with a general enquiry.
            </Typography>
            <Button variant='contained' href={uiConfig.issues?.contactHref}>
              Contact team
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}
