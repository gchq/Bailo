import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useRouter } from 'next/router'
import React from 'react'

import { useGetCurrentUser } from '../data/user'
import SchemaDesigner from '../src/SchemaDesign/SchemaDesigner'
import SchemaList from '../src/SchemaDesign/SchemaList'
import Wrapper from '../src/Wrapper'

enum TabOptions {
  SCHEMAS = 'schemas',
  DESIGNER = 'designer',
}

const isTabOption = (value: string): value is TabOptions => !!TabOptions[value]

export default function Schemas() {
  const [group, setGroup] = React.useState<TabOptions>(TabOptions.SCHEMAS)

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
      {currentUser && currentUser.roles.includes('admin') ? (
        <>
          <Tabs value={group} onChange={handleGroupChange} aria-label='Schema design page tabs'>
            <Tab label='Schemas' value={TabOptions.SCHEMAS} />
            <Tab disabled label='Designer (BETA)' value={TabOptions.DESIGNER} />
          </Tabs>
          {group === TabOptions.SCHEMAS && <SchemaList />}
          {group === TabOptions.DESIGNER && <SchemaDesigner />}
        </>
      ) : (
        <Typography variant='h5' component='p'>
          Error: You are not authorised to view this page.
        </Typography>
      )}
    </Wrapper>
  )
}
