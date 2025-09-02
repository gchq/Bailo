import { PersonAdd } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { useState } from 'react'
import Title from 'src/common/Title'
import ReviewRoleFormContainer from 'src/reviewRoles/ReviewRoleFormContainer'
import { ReviewRolesFormData, RoleKind } from 'types/types'

export default function ReviewRolesForm() {
  const [formData, setFormData] = useState<ReviewRolesFormData>({
    name: '',
    shortName: '',
    kind: RoleKind.REVIEW,
    description: '',
    defaultEntities: [],
    lockEntities: false,
  })

  const newReviewRoleHeading = (
    <Stack alignItems='center' justifyContent='center' spacing={2} sx={{ mb: 4 }}>
      <Typography variant='h6' component='h1'>
        Create new Role
      </Typography>
      <PersonAdd color='primary' fontSize='large' />
    </Stack>
  )

  return (
    <>
      <Title text='Create new Review Role' />
      <ReviewRoleFormContainer
        providedData={false}
        formData={formData}
        setFormData={setFormData}
        headingComponent={newReviewRoleHeading}
      />
    </>
  )
}
