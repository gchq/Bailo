import { useRouter } from 'next/router'
import { useState } from 'react'

import PageWithTabs from '../../../src/common/PageWithTabs'
import Overview from '../../../src/model/beta/Overview'
import Releases from '../../../src/model/beta/Releases'
import Wrapper from '../../../src/Wrapper.beta'

export default function Model() {
  const router = useRouter()
  const { uuid }: { uuid?: string } = router.query
  const [model, _setModel] = useState<any>({ uuid: uuid })

  function myFunction() {
    console.log('Button clicked!')
  }
  return (
    <Wrapper title='Model' page='marketplace' fullWidth>
      <PageWithTabs
        title={uuid}
        tabs={[
          { title: 'Overview', view: <Overview model={model} /> },
          { title: 'Releases', view: <Releases model={model} /> },
        ]}
        actionButtonOnClick={myFunction}
        actionButtonTitle='Actions'
        displayActionButton
      />
    </Wrapper>
  )
}
