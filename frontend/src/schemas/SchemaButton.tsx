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
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import renderQueryState from 'src/common/renderQueryState'
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
      schema.reviewRoles &&
      schema.reviewRoles.length > 0 && (
        <Box>
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
          >
            This schema has the following default roles:
          </Typography>
          <List dense>
            {schema.reviewRoles.map((schemaRole) => (
              <ListItem key={schemaRole}>
                {reviewRoles.find((reviewRole) => reviewRole.shortName === schemaRole)?.name || 'Unknown role'}
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      ),
    [reviewRoles, schema.reviewRoles],
  )

  const queryState = renderQueryState([isReviewRolesError], isReviewRolesLoading)
  if (queryState) {
    return queryState
  }
  return (
    <Grid size={{ md: 6, sm: 12 }}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <CardContent sx={{ pb: 0 }}>
          <Stack spacing={1}>
            <Typography
              variant='button'
              color='primary'
              sx={{
                fontWeight: 'bold',
              }}
            >
              {schema.name}
            </Typography>
            <MarkdownDisplay>{schema.description}</MarkdownDisplay>
            <Divider />
            {reviewRoleList}
          </Stack>
        </CardContent>
        <CardActions sx={{ px: 2, pb: 2, textAlign: 'right' }}>
          <Stack spacing={2} sx={{ width: '100%' }}>
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
