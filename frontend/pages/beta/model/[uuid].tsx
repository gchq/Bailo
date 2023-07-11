import { useRouter } from 'next/router'
import { ReactElement } from 'react'

import PageWithTabs from '../../../src/common/PageWithTabs'
import Overview from '../../../src/model/beta/Overview'
import Wrapper from '../../../src/Wrapper.beta'

export default function Model() {
  const router = useRouter()
  const { uuid }: { uuid?: string } = router.query

  function myFunction() {
    console.log('Button clicked!')
  }
  return (
    <Wrapper title='Model' page='marketplace' fullWidth>
      <PageWithTabs
        title={uuid}
        tabs={[{ title: 'Overview', view: OverviewTab }]}
        actionButtonOnClick={myFunction}
        actionButtonTitle='Deploy'
        displayActionButton
      />
    </Wrapper>
  )
}

const OverviewTab: ReactElement = <Overview />
