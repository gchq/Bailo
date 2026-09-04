import { Container, Divider, List, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import ReviewsList from 'src/reviews/ReviewsList'
import { isReviewKind, ReviewKind, ReviewKindKeys, ReviewListStatusKeys } from 'types/types'

export interface ReviewsListContainerProps {
  status: ReviewListStatusKeys
}

export default function ReviewsListContainer({ status }: ReviewsListContainerProps) {
  const router = useRouter()
  const { category } = router.query

  const cateogories = [
    { category: ReviewKind.ACCESS, title: 'Access requests' },
    { category: ReviewKind.RELEASE, title: 'Releases' },
    { category: ReviewKind.LIFECYCLE, title: 'Model card lifecycle' },
    { category: ReviewKind.DEPLOYMENTS, title: 'Deployment assessments' },
  ]

  const categoryList = () =>
    cateogories.map((listbutton) => (
      <SimpleListItemButton
        key={listbutton.category}
        selected={selectedCategory === listbutton.category}
        onClick={() => handleListItemClick(listbutton.category)}
      >
        {listbutton.title}
      </SimpleListItemButton>
    ))

  const [selectedCategory, setSelectedCategory] = useState<ReviewKindKeys>(
    isReviewKind(category) ? category : ReviewKind.ACCESS,
  )

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
      <List sx={{ width: '200px' }}>{categoryList()}</List>
      <Container sx={{ my: 2 }}>
        <ReviewsList kind={selectedCategory} status={status} />
      </Container>
    </Stack>
  )
}
