import { Container, Divider, List, Stack } from '@mui/material'
import router from 'next/router'
import { useEffect, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import ReviewsList from 'src/reviews/ReviewsList'
import { ReviewKind, ReviewKindKeys, ReviewListStatusKeys } from 'types/types'

function isReviewListContainerCategory(value: string | string[] | undefined): value is ReviewKindKeys {
  return value === ReviewKind.RELEASE || value === ReviewKind.ACCESS
}

export interface ReviewsListContainerProps {
  status: ReviewListStatusKeys
}

export default function ReviewsListContainer({ status }: ReviewsListContainerProps) {
  const { category } = router.query

  const [selectedCategory, setSelectedCategory] = useState<ReviewKindKeys>(ReviewKind.RELEASE)

  useEffect(() => {
    if (isReviewListContainerCategory(category)) {
      setSelectedCategory(category ?? ReviewKind.RELEASE)
    }
  }, [category])

  const handleListItemClick = (category: ReviewKindKeys) => {
    setSelectedCategory(category)
    router.replace({
      query: { ...router.query, category },
    })
  }
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ sm: 2 }}
      divider={<Divider orientation='vertical' flexItem />}
    >
      <List sx={{ width: '200px' }}>
        <SimpleListItemButton
          selected={selectedCategory === ReviewKind.RELEASE}
          onClick={() => handleListItemClick(ReviewKind.RELEASE)}
        >
          Releases
        </SimpleListItemButton>
        <SimpleListItemButton
          selected={selectedCategory === ReviewKind.ACCESS}
          onClick={() => handleListItemClick(ReviewKind.ACCESS)}
        >
          Access requests
        </SimpleListItemButton>
      </List>
      <Container sx={{ my: 2 }}>
        {selectedCategory === ReviewKind.RELEASE && <ReviewsList kind={ReviewKind.RELEASE} status={status} />}
        {selectedCategory === ReviewKind.ACCESS && <ReviewsList kind={ReviewKind.ACCESS} status={status} />}
      </Container>
    </Stack>
  )
}
