import PageWithTabs from '../../src/common/PageWithTabs'
import ReviewsList from '../../src/reviews/ReviewsList'
import Wrapper from '../../src/Wrapper.beta'

export default function Review() {
  return (
    <Wrapper title='Review' page='beta/review' fullWidth>
      <PageWithTabs
        title='Your Reviews'
        tabs={[
          { title: 'Release reviews', view: <ReviewsList kind='release' /> },
          { title: 'Access request reviews', view: <ReviewsList kind='access' /> },
          { title: 'Archived', view: <ReviewsList isActive={false} /> },
        ]}
      />
    </Wrapper>
  )
}
