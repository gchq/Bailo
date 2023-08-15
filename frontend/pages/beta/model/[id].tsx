import { useRouter } from 'next/router'

import { useGetModel } from '../../../actions/model'
import EmptyBlob from '../../../src/common/EmptyBlob'
import Loading from '../../../src/common/Loading'
import PageWithTabs from '../../../src/common/PageWithTabs'
import Overview from '../../../src/model/beta/Overview'
import Releases from '../../../src/model/beta/Releases'
import Settings from '../../../src/model/beta/Settings'
import Wrapper from '../../../src/Wrapper.beta'

export default function Model() {
  const router = useRouter()
  const { id }: { id?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(id)

  // TODO implement function
  function myFunction() {
    console.log('Button pressed')
  }
  return (
    <Wrapper title='Model' page='marketplace' fullWidth>
      {isModelLoading && <Loading />}
      {!model && !isModelLoading && <EmptyBlob text={`Oh no, it looks like model ${id} doesn't exist!`} />}
      {model && !isModelLoading && !isModelError && (
        <PageWithTabs
          title={model.id}
          tabs={[
            { title: 'Overview', view: <Overview model={model} /> },
            { title: 'Releases', view: <Releases model={model} /> },
            { title: 'Settings', view: <Settings model={model} /> },
          ]}
          actionButtonOnClick={myFunction}
          actionButtonTitle='Actions'
          displayActionButton
        />
      )}
    </Wrapper>
  )
}
