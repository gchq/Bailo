import ApprovalsList from '../../src/approvals/ApprovalsList'
import PageWithTabs from '../../src/common/PageWithTabs'
import Wrapper from '../../src/Wrapper.beta'

export default function Review() {
  return (
    <Wrapper title='Review' page='marketplace' fullWidth>
      <PageWithTabs
        title='Your Reviews'
        tabs={[
          { title: 'Release reviews', view: <ApprovalsList kind='release' /> },
          { title: 'Access request reviews', view: <ApprovalsList kind='access' /> },
          { title: 'Archived', view: <ApprovalsList isActive={false} /> },
        ]}
      />
    </Wrapper>
  )
}
