import { ArrowBack } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Button,
  Card,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult, useListModels } from 'actions/model'
import { postUserToken } from 'actions/user'
import { ChangeEvent, SyntheticEvent, useCallback, useMemo, useState } from 'react'
import Title from 'src/common/Title'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import TokenDialog from 'src/settings/authentication/TokenDialog'
import { TokenActions, TokenActionsKeys, TokenInterface, TokenScope } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

export default function NewToken() {
  const theme = useTheme()
  const [description, setDescription] = useState('')
  const [isAllModels, setIsAllModels] = useState(false)
  const [selectedModels, setSelectedModels] = useState<EntrySearchResult[]>([])
  const [selectedActions, setSelectedActions] = useState<TokenActionsKeys[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState<TokenInterface | undefined>()

  const { models, isModelsLoading, isModelsError } = useListModels('model')

  const modelsAutocompletePlaceholder = useMemo(() => {
    if (isAllModels) return 'All models selected'
    if (selectedModels.length) return ''
    return 'Select models'
  }, [isAllModels, selectedModels.length])

  const isGenerateButtonDisabled = useMemo(
    () => !description || !(isAllModels || selectedModels.length) || !selectedActions.length,
    [description, isAllModels, selectedModels.length, selectedActions.length],
  )

  const handleSelectedActionsChange = useCallback(
    (action: TokenActionsKeys, checked: boolean) => {
      if (checked) {
        setSelectedActions([...selectedActions, action])
      } else {
        const foundIndex = selectedActions.findIndex((selectedRepository) => selectedRepository === action)
        if (foundIndex >= 0) {
          const updatedSelectedActions = [...selectedActions]
          updatedSelectedActions.splice(foundIndex, 1)
          setSelectedActions(updatedSelectedActions)
        }
      }
    },
    [selectedActions],
  )

  const actionCheckboxes = useMemo(
    () =>
      Object.values(TokenActions).map((action) => (
        <Grid item xs={6} key={action}>
          <FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  name={action}
                  checked={selectedActions.includes(action)}
                  onChange={(_event, checked) => handleSelectedActionsChange(action, checked)}
                  data-test={`${action.replace(':', '')}ActionCheckbox`}
                />
              }
              label={action}
            />
          </FormControl>
        </Grid>
      )),
    [handleSelectedActionsChange, selectedActions],
  )

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value)
  }

  const handleAllModelsChange = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setIsAllModels(checked)
    setSelectedModels([])
  }

  const handleSelectedModelsChange = (_: SyntheticEvent<Element, Event>, value: EntrySearchResult[]) => {
    setSelectedModels(value)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    const scope = isAllModels ? TokenScope.All : TokenScope.Models
    const modelIds = selectedModels.map((model) => model.id)
    const response = await postUserToken(description, scope, modelIds, selectedActions)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      const { token } = await response.json()
      setToken(token)
    }

    setIsLoading(false)
  }

  return (
    <>
      <Title text='Personal Access Token' />
      <Container maxWidth='md'>
        <Card sx={{ my: 4, p: 4 }}>
          <Stack spacing={2}>
            <div>
              <Link href={'/settings?tab=authentication'}>
                <Button startIcon={<ArrowBack />}>Back to settings</Button>
              </Link>
            </div>
            <Stack spacing={2}>
              <Stack>
                <Typography fontWeight='bold'>
                  Description <span style={{ color: theme.palette.error.main }}>*</span>
                </Typography>
                <TextField
                  required
                  multiline
                  size='small'
                  value={description}
                  maxRows={8}
                  onChange={handleDescriptionChange}
                  inputProps={{ 'data-test': 'tokenDescriptionTextField' }}
                />
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>
                  Models <span style={{ color: theme.palette.error.main }}>*</span>
                </Typography>
                <Stack direction='row' alignItems='start' justifyContent='center' spacing={2}>
                  <FormControl>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name='All'
                          checked={isAllModels}
                          disabled={isModelsLoading}
                          onChange={handleAllModelsChange}
                          data-test='allModelsCheckbox'
                        />
                      }
                      label='All'
                    />
                  </FormControl>
                  <Autocomplete
                    multiple
                    fullWidth
                    value={selectedModels}
                    loading={isModelsLoading}
                    disabled={isAllModels}
                    limitTags={5}
                    getLimitTagsText={(more) => `+${plural(more, 'model')}`}
                    options={models}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={handleSelectedModelsChange}
                    ChipProps={{ size: 'small' }}
                    renderInput={(params) => (
                      <TextField {...params} required size='small' placeholder={modelsAutocompletePlaceholder} />
                    )}
                  />
                </Stack>
              </Stack>
              <Stack>
                <Typography fontWeight='bold'>
                  Actions <span style={{ color: theme.palette.error.main }}>*</span>
                </Typography>
                <Grid container>{actionCheckboxes}</Grid>
              </Stack>
              <Stack alignItems='flex-end'>
                <LoadingButton
                  variant='contained'
                  loading={isLoading}
                  disabled={isGenerateButtonDisabled}
                  onClick={handleSubmit}
                  data-test='generatePersonalAccessTokenButton'
                >
                  Generate Token
                </LoadingButton>
                <MessageAlert message={isModelsError?.info.message || errorMessage} severity='error' />
              </Stack>
            </Stack>
          </Stack>
        </Card>
      </Container>
      {token && <TokenDialog token={token} />}
    </>
  )
}
