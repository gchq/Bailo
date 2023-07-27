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
        name: 'test-model-123',
        semver: '1.0.1',
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: 'This is another release',
        managerApproved: ApprovalStates.Accepted,
        reviewerApproved: ApprovalStates.NoResponse,
        files: ['myfile.tar.gz'],
        images: ['dockerimage.tar.gz'],
      },
      {
        name: 'test-model-123',
        semver: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: 'This is an initial release',
        managerApproved: ApprovalStates.Accepted,
        reviewerApproved: ApprovalStates.Declined,
        files: ['myfile.tar.gz'],
        images: ['dockerimage.tar.gz'],
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
