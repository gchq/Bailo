import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import MessageAlert from 'src/MessageAlert'
import { SchemaInterface } from 'types/types'

interface SchemaButtonProps {
  schema: SchemaInterface
  onClick: () => void
  loading?: boolean
}

export default function SchemaButton({ schema, onClick, loading = false }: SchemaButtonProps) {
  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles()

  const reviewRoleList = useMemo(
    () =>
      schema.reviewRoles && (
        <Box>
          <Typography fontWeight='bold'>This schema has the following default roles:</Typography>
          <List dense>
            {schema.reviewRoles.map((schemaRole) => (
              <ListItem key={schemaRole}>
                {reviewRoles.find((reviewRole) => reviewRole.shortName === schemaRole)?.name || 'Unknown role'}
              </ListItem>
            ))}
          </List>
        </Box>
      ),
    [reviewRoles, schema.reviewRoles],
  )

  if (isReviewRolesLoading) {
    return <Loading />
  }

  if (isReviewRolesError) {
    return <MessageAlert message={isReviewRolesError.info.message} severity='error' />
  }
  return (
    <Grid size={{ md: 6, sm: 12 }}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <CardContent sx={{ pb: 0 }}>
          <Stack spacing={1}>
            <Typography variant='button' fontWeight='bold' color='primary'>
              {schema.name}
            </Typography>
            <MarkdownDisplay>{schema.description}</MarkdownDisplay>
            <Divider />
            {reviewRoleList}
          </Stack>
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2, textAlign: 'right' }}>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Divider />
            <Button
              loading={loading}
              variant='contained'
              size='small'
              onClick={onClick}
              data-test={`selectSchemaButton-${schema.id}`}
            >
              Select schema
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </Grid>
  )
}
