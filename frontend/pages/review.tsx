import { useMemo } from 'react'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import ReviewsListContainer from 'src/reviews/ReviewsListContainer'
import { ReviewListStatus } from 'types/types'

export default function Review() {
  const tabs = useMemo(
    () => [
      { title: 'Your open reviews', path: 'open', view: <ReviewsListContainer status={ReviewListStatus.OPEN} /> },
      {
        title: 'Your archived reviews',
        path: 'archived',
        view: <ReviewsListContainer status={ReviewListStatus.ARCHIVED} />,
      },
    ],
    [],
  )

  return (
    <>
      <Title text='Review' />
      <PageWithTabs title='Your Reviews' tabs={tabs} />
    </>
  )
}
