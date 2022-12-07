import { useGetCurrentUser } from '@/data/user'
import Wrapper from '@/src/Wrapper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import SchemaDesigner from '@/src/SchemaDesign/SchemaDesigner'
import { useRouter } from 'next/router'
import React from 'react'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import SchemaList from '@/src/SchemaDesign/SchemaList'

type TabOptions = 'schemas' | 'designer'
function isTabOption(value: string): value is TabOptions {
  return ['schemas', 'designer'].includes(value)
}

export default function Schemas() {
  const [group, setGroup] = React.useState<TabOptions>('schemas')

  const router = useRouter()
  const { tab }: { tab?: TabOptions } = router.query
  const { currentUser } = useGetCurrentUser()

  const handleGroupChange = (_event: React.SyntheticEvent, newValue: TabOptions) => {
    setGroup(newValue)
    router.push(`/schemas?tab=${newValue}`)
  }

  React.useEffect(() => {
    if (tab !== undefined && isTabOption(tab)) {
      setGroup(tab)
    }
  }, [tab])

  return (
    <Wrapper title='Design Schema' page='schemas'>
      <Box>
        {currentUser && currentUser.roles.includes('admin') ? (
          <Box>
            <Tabs value={group} onChange={handleGroupChange} aria-label='basic tabs example'>
              <Tab label='Schemas' value='schemas' />
              <Tab label='Designer' value='designer' />
            </Tabs>
            {group === 'schemas' && <SchemaList />}
            {group === 'designer' && <SchemaDesigner />}
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
