import { Box, Grid, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useGetModelRoles } from 'actions/model'
import { useCallback } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { RoleKind } from 'types/types'

interface ModelRolesInfoProps {
  modelId: string
}

export default function ModelRolesInfo({ modelId }: ModelRolesInfoProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)

  const roles = useCallback(
    (kind: string) => {
      return modelRoles
        .filter((modelRole) => modelRole.kind === kind)
        .map((filteredModelRole) => (
          <Box key={filteredModelRole.id}>
            <Typography fontWeight='bold'>{filteredModelRole.name}</Typography>
            <Typography>{filteredModelRole.description}</Typography>
          </Box>
        ))
    },
    [modelRoles],
  )

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      {!isModelRolesLoading && (
        <Stack spacing={2}>
          <Typography>
            Roles in Bailo are split into two categories; standard and dynamic. Standard roles are generic across
            different schema and are used for determining model permissions for general purpose model upkeep, whereas
            dynamic roles are created on a per schema basis and used as part of the review process. The dynamic roles
            presented below are specified on the schema selected for this model and may not apply to other models using
            a different schema.
          </Typography>
          <Grid container spacing={1}>
            <Grid item sm={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography component='h3' variant='h6' fontWeight='bold'>
                    Standard Roles
                  </Typography>
                  <Typography variant='caption'>The following roles are generic across all models</Typography>
                </Box>
                {roles(RoleKind.MODEL)}
              </Stack>
            </Grid>
            <Grid item sm={6}>
              <Stack spacing={1}>
                <Box>
                  <Typography component='h3' variant='h6' fontWeight='bold'>
                    Dynamic Roles
                  </Typography>
                  <Typography variant='caption'>
                    The following roles are specified by this model&apos;s schema
                  </Typography>
                </Box>
                {roles(RoleKind.SCHEMA)}
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}
    </>
  )
}
