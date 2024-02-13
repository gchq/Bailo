import { useMemo } from 'react'
import PageWithTabs from 'src/common/PageWithTabs'
import ReviewsList from 'src/reviews/ReviewsList'
import Wrapper from 'src/Wrapper'

export default function Review() {
  const tabs = useMemo(
    () => [
      { title: 'Release reviews', path: 'releases', view: <ReviewsList kind='release' /> },
      { title: 'Access request reviews', path: 'access', view: <ReviewsList kind='access' /> },
      { title: 'Archived', path: 'archived', view: <ReviewsList kind='archived' /> },
    ],
    [],
  )

  return (
    <Wrapper title='Review' page='beta/review' fullWidth>
      <PageWithTabs title='Your Reviews' tabs={tabs} />
    </Wrapper>
  )
}
