import { ArrowBack } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  AutocompleteRenderGetTagProps,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { EntrySearchResult, useListModels } from 'actions/model'
import { useGetUiConfig } from 'actions/uiConfig'
import { postUserToken } from 'actions/user'
import { ChangeEvent, SyntheticEvent, useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import TokenDialog from 'src/settings/authentication/TokenDialog'
import { TokenActionKind, TokenInterface, TokenScope } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

export default function NewToken() {
  const theme = useTheme()
  const [description, setDescription] = useState('')
  const [isAllModels, setIsAllModels] = useState(true)
  const [selectedModels, setSelectedModels] = useState<EntrySearchResult[]>([])
  const [isAllActions, setIsAllActions] = useState(false)
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState<TokenInterface | undefined>()

  const { models, isModelsLoading, isModelsError } = useListModels('model')
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const modelsAutocompletePlaceholder = useMemo(() => {
    if (isAllModels) return 'All models selected'
    if (selectedModels.length) return ''
    return 'Select models'
  }, [isAllModels, selectedModels.length])

  const isGenerateButtonDisabled = useMemo(
    () => !description || !(isAllModels || selectedModels.length) || !selectedActions.length,
    [description, isAllModels, selectedModels.length, selectedActions.length],
  )

  const tokenActions = uiConfig?.tokenActions || []

  const actionOptions = Object.keys(tokenActions)

  const [TokenReadAction, TokenWriteAction] = actionOptions.reduce<Record<string, string>[]>(
    ([readActions, writeActions], action) => {
      let groupedActions = [readActions, writeActions]
      const [name, kind] = action.split(':')

      if (kind === TokenActionKind.READ) {
        groupedActions = [{ ...readActions, [name]: action }, writeActions]
      }
      if (kind === TokenActionKind.WRITE) {
        groupedActions = [readActions, { ...writeActions, [name]: action }]
      }

      return groupedActions
    },
    [{}, {}],
  )

  const renderActionTags = useCallback(
    (value: string[], getTagProps: AutocompleteRenderGetTagProps) =>
      value.map((option, index) => {
        const isReadAction = (action: string) => {
          return Object.values(TokenReadAction).includes(action)
        }

        const actionName = getActionName(option)
        const isRequired = isReadAction(option) && selectedActions.includes(TokenWriteAction[actionName])

        // overrideProps is used to disable delete functionality for model:read and any selected
        // read actions with a corresponding selected write action
        const overrideProps = {
          ...(isRequired && {
            onDelete: undefined,
          }),
        }

        return (
          <Chip
            label={isRequired ? `${option} (required)` : option}
            size='small'
            {...getTagProps({ index })}
            {...overrideProps}
            key={option}
          />
        )
      }),
    [selectedActions, TokenWriteAction, TokenReadAction],
  )

  if (isUiConfigLoading) {
    return <Loading />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message}></MessageAlert>
  }

  const isWriteAction = (action: string) => {
    return Object.values(TokenWriteAction).includes(action)
  }

  const getActionName = (action: string) => {
    const [name, _kind] = action.split(':')
    return name
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value)
  }

  const handleAllModelsChange = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setIsAllModels(checked)
    setSelectedModels([])
  }

  const handleSelectedModelsChange = (_event: SyntheticEvent<Element, Event>, value: EntrySearchResult[]) => {
    setSelectedModels(value)
  }

  const handleAllActionsChange = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setIsAllActions(checked)
    setSelectedActions(checked ? actionOptions : [])
  }

  const handleSelectedActionsChange = (
    _event: SyntheticEvent<Element, Event>,
    value: string[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string>,
  ) => {
    if (reason === 'clear') {
      setIsAllActions(false)
      setSelectedActions([])
      return
    }

    const updatedValue = [...value]

    // If the selected option is a write action, ensure the corresponding
    // read action is also selected
    if (reason === 'selectOption' && details && isWriteAction(details.option)) {
      const actionName = getActionName(details.option)
      if (!updatedValue.includes(TokenReadAction[actionName])) {
        updatedValue.push(TokenReadAction[actionName])
      }
    }

    setIsAllActions(updatedValue.length === actionOptions.length)
    setSelectedActions(updatedValue)
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
                  Permissions <span style={{ color: theme.palette.error.main }}>*</span>
                </Typography>
                <Stack direction='row' alignItems='start' justifyContent='center' spacing={2}>
                  <FormControl>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name='All'
                          checked={isAllActions}
                          onChange={handleAllActionsChange}
                          data-test='allActionsCheckbox'
                        />
                      }
                      label='All'
                    />
                  </FormControl>
                  <Autocomplete
                    multiple
                    fullWidth
                    value={selectedActions}
                    options={actionOptions}
                    limitTags={3}
                    disableClearable={selectedActions.length === 1}
                    getLimitTagsText={(more) => `+${plural(more, 'action')}`}
                    onChange={handleSelectedActionsChange}
                    renderInput={(params) => <TextField {...params} required size='small' />}
                    renderTags={renderActionTags}
                  />
                </Stack>
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
