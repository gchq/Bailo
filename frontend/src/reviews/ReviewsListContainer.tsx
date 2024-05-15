import { Container, Divider, List, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import ReviewsList from 'src/reviews/ReviewsList'
import { isReviewKind, ReviewKind, ReviewKindKeys, ReviewListStatusKeys } from 'types/types'

export interface ReviewsListContainerProps {
  status: ReviewListStatusKeys
}

export default function ReviewsListContainer({ status }: ReviewsListContainerProps) {
  const router = useRouter()
  const { category } = router.query

  const [selectedCategory, setSelectedCategory] = useState<ReviewKindKeys>(ReviewKind.ACCESS)

  useEffect(() => {
    if (isReviewKind(category)) {
      setSelectedCategory(category)
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
          selected={selectedCategory === ReviewKind.ACCESS}
          onClick={() => handleListItemClick(ReviewKind.ACCESS)}
        >
          Access Requests
        </SimpleListItemButton>
        <SimpleListItemButton
          selected={selectedCategory === ReviewKind.RELEASE}
          onClick={() => handleListItemClick(ReviewKind.RELEASE)}
        >
          Releases
        </SimpleListItemButton>
      </List>
      <Container sx={{ my: 2 }}>
        <ReviewsList kind={selectedCategory} status={status} />
      </Container>
    </Stack>
  )
}
