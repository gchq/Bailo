import { PersonAdd } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { postReviewRole } from 'actions/reviewRoles'
import router from 'next/router'
import { FormEvent, useState } from 'react'
import Title from 'src/common/Title'
import ReviewRoleFormContainer from 'src/reviewRoles/ReviewRoleFormContainer'
import { CollaboratorEntry, ReviewRolesFormData, RoleKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

export default function ReviewRolesForm() {
  const [formData, setFormData] = useState<ReviewRolesFormData>({
    name: '',
    shortName: '',
    systemRole: '',
    kind: RoleKind.REVIEW,
    description: '',
    defaultEntities: [],
    lockEntities: false,
  })
  const [defaultEntitiesEntry, setDefaultEntitiesEntry] = useState<Array<CollaboratorEntry>>(
    formData.defaultEntities
      ? formData.defaultEntities.map((defaultEntity) => ({ entity: defaultEntity, roles: [] }))
      : [],
  )

  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const newReviewRoleHeading = (
    <Stack alignItems='center' justifyContent='center' spacing={2} sx={{ mb: 4 }}>
      <Typography variant='h6' component='h1'>
        Create new Role
      </Typography>
      <PersonAdd color='primary' fontSize='large' />
    </Stack>
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    const res = await postReviewRole({
      ...formData,
      defaultEntities: defaultEntitiesEntry.map((entity) => entity.entity),
    } as ReviewRolesFormData)

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      router.push(`/reviewRoles/view`)
    }

    setLoading(false)
  }

  return (
    <>
      <Title text='Create new Review Role' />
      <ReviewRoleFormContainer
        providedData={false}
        formData={formData}
        setFormData={setFormData}
        headingComponent={newReviewRoleHeading}
        loading={loading}
        errorMessage={errorMessage}
        defaultEntitiesEntry={defaultEntitiesEntry}
        setDefaultEntities={setDefaultEntitiesEntry}
        handleSubmit={handleSubmit}
      />
    </>
  )
}
