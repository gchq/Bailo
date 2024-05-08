import { Container, Divider, List, Stack } from '@mui/material'
import router from 'next/router'
import { useEffect, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import ReviewsList from 'src/reviews/ReviewsList'
import { ReviewListStatusKeys } from 'types/types'

export const ReviewListContainerCategory = {
  RELEASE: 'release',
  ACCESS: 'access',
} as const

export type ReviewListContainerCategoryKeys =
  (typeof ReviewListContainerCategory)[keyof typeof ReviewListContainerCategory]

function isReviewListContainerCategory(value: string | string[] | undefined): value is ReviewListContainerCategoryKeys {
  return value === ReviewListContainerCategory.RELEASE || value === ReviewListContainerCategory.ACCESS
}

export interface ReviewsListContainerProps {
  status: ReviewListStatusKeys
}

export default function ReviewsListContainer({ status }: ReviewsListContainerProps) {
  const { category } = router.query

  const [selectedCategory, setSelectedCategory] = useState<ReviewListContainerCategoryKeys>(
    ReviewListContainerCategory.RELEASE,
  )

  useEffect(() => {
    if (isReviewListContainerCategory(category)) {
      setSelectedCategory(category ?? ReviewListContainerCategory.RELEASE)
    }
  }, [category])

  const handleListItemClick = (category: ReviewListContainerCategoryKeys) => {
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
          selected={selectedCategory === ReviewListContainerCategory.RELEASE}
          onClick={() => handleListItemClick(ReviewListContainerCategory.RELEASE)}
        >
          Releases
        </SimpleListItemButton>
        <SimpleListItemButton
          selected={selectedCategory === ReviewListContainerCategory.ACCESS}
          onClick={() => handleListItemClick(ReviewListContainerCategory.ACCESS)}
        >
          Access requests
        </SimpleListItemButton>
      </List>
      <Container sx={{ my: 2 }}>
        {selectedCategory === ReviewListContainerCategory.RELEASE && <ReviewsList kind='release' status={status} />}
        {selectedCategory === ReviewListContainerCategory.ACCESS && <ReviewsList kind='access' status={status} />}
      </Container>
    </Stack>
  )
}
