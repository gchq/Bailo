import { useRouter } from 'next/router'
import { useState } from 'react'

import PageWithTabs from '../../../src/common/PageWithTabs'
import Overview from '../../../src/model/beta/Overview'
import Releases from '../../../src/model/beta/Releases'
import Wrapper from '../../../src/Wrapper.beta'
import { ApprovalStates } from '../../../types/types'

export default function Model() {
  const router = useRouter()
  const { uuid }: { uuid?: string } = router.query
  const [model, _setModel] = useState<any>({
    uuid: uuid,
    releases: [
      {
        name: uuid,
        semver: '1.0.1',
        timestamp: '2023-07-12T11:09:57.832+00:00',
        notes: 'This is another release',
        managerApproved: ApprovalStates.Accepted,
        reviewerApproved: ApprovalStates.NoResponse,
        files: [{ name: 'myfile.tar.gz', size: '6345kb' }],
        images: [{ ref: 'dockerimage.tar.gz', size: '45mb' }],
      },
      {
        name: uuid,
        semver: '1.0.0',
        timestamp: '2023-07-10T11:09:57.832+00:00',
        notes: 'This is an initial release',
        managerApproved: ApprovalStates.Accepted,
        reviewerApproved: ApprovalStates.Declined,
        files: [{ name: 'myfile.tar.gz', size: '4345kb' }],
        images: [{ ref: 'dockerimage.tar.gz', size: '43mb' }],
      },
    ],
  })

  function myFunction() {
    console.log('Button clicked!')
  }

  return (
    <Wrapper title='Model' page='marketplace' fullWidth>
      <PageWithTabs
        title={uuid}
        tabs={[
          { title: 'overview', view: <Overview model={model} /> },
          { title: 'releases', view: <Releases model={model} /> },
        ]}
        actionButtonOnClick={myFunction}
        actionButtonTitle='Actions'
        displayActionButton
      />
    </Wrapper>
  )
}
