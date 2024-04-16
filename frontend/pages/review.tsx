import { useMemo } from 'react'
import PageWithTabs from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import ReviewsList from 'src/reviews/ReviewsList'

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
    <>
      <Title title='Review' />
      <PageWithTabs title='Your Reviews' tabs={tabs} />
    </>
  )
}
