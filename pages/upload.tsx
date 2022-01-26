import { useEffect, useState } from 'react'
import Wrapper from 'src/Wrapper'
import Paper from '@mui/material/Paper'
import { useGetDefaultSchema, useGetSchemas } from '../data/schema'
import MultipleErrorWrapper from '../src/errors/MultipleErrorWrapper'
import FormTabs from '../src/common/FormTabs'
import { useRouter } from 'next/router'
import UploadFile from '../src/UploadFlow/UploadFile'
import Alert from '@mui/material/Alert'
import { putEndpoint } from '../data/api'
import { useGetModelVersion } from '../data/model'

export default function Upload() {
  const router = useRouter()

  const queryModelUuid = router.query.modelUuid as string
  const queryVersion = router.query.version as string

  const { defaultSchema, isDefaultSchemaError, isDefaultSchemaLoading } = useGetDefaultSchema('UPLOAD')
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas('UPLOAD')
  const { version, isVersionLoading } = useGetModelVersion(queryModelUuid, queryVersion)

  const [error, setError] = useState(undefined)
  const [versionToEdit, setVersionToEdit] = useState<any>(undefined)
  const [showAlert, setShowAlert] = useState<boolean>(false)
  const [alertText, setAlertText] = useState<string>('')

  useEffect(() => {
    if (!isVersionLoading && version !== undefined) {
      setVersionToEdit(version)
    }
  }, [isVersionLoading, version])

  const errorWrapper = MultipleErrorWrapper(`Unable to load upload page`, {
    isDefaultSchemaError,
    isSchemasError,
  })
  if (errorWrapper) return errorWrapper

  if (isDefaultSchemaLoading || isSchemasLoading) {
    return <Wrapper title='Loading...' page={'upload'} />
  }

  const onSubmit = async (data: any, schema: any, { code, binary }: { code: File; binary: File }) => {
    setError(undefined)
    setShowAlert(false)

    for (const meta of ['required', '$schema', 'definitions', 'type', 'properties']) {
      delete data[meta]
    }

    data.schemaRef = schema.reference

    const form = new FormData()

    if (router.query.mode === 'edit' && version !== undefined) {
      const put = await putEndpoint(`/api/v1/version/${version._id}`, data).then(async (res) => {
        if (res.status >= 400) {
          try {
            // try and parse error from body
            return await res.json()
          } catch (e) {
            return {
              message: res.statusText,
            }
          }
        } else {
          if (res.status === 200) {
            router.push(`/model/${router.query.modelUuid}`)
          }
        }
      })
    } else {
      form.append('code', code)
      form.append('binary', binary)
      form.append('metadata', JSON.stringify(data))

      const mode: string = router.query.mode !== undefined ? router.query.mode.toString() : 'upload'

      const uploadAddress =
        mode === 'newVersion' ? '/api/v1/model?mode=' + mode + '&modelUuid=' + router.query.modelUuid : '/api/v1/model'
      const upload = await fetch(uploadAddress, {
        method: 'POST',
        body: form,
      }).then(async (res) => {
        if (res.status === 409) {
          setAlertText(res.statusText)
          setShowAlert(true)
          return {
            message: res.statusText,
          }
        } else if (res.status >= 400) {
          try {
            // try and parse error from body
            return await res.json()
          } catch (e) {
            return {
              message: res.statusText,
            }
          }
        } else {
          return res.json()
        }
      })
      const { uuid: uploadUuid, message: uploadError } = upload
      if (uploadError) {
        setError(uploadError)
      }
      if (uploadUuid) {
        router.push(`/model/${uploadUuid}`)
      }
    }
  }

  return (
    <Wrapper title={'Upload Model'} page={'upload'}>
      <Paper variant='outlined' sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
        <FormTabs
          defaultSchema={defaultSchema}
          error={error}
          schemas={schemas}
          onSubmit={onSubmit}
          name={'Model'}
          omitFields={[
            'properties.highLevelDetails.properties.modelID',
            'properties.highLevelDetails.properties.initialVersionRequested',
          ]}
          UploadForm={UploadFile}
          mode={router.query.mode}
          modelToEdit={versionToEdit}
        />
        {showAlert && (
          <Alert severity='error' onClose={() => setShowAlert(false)}>
            {alertText}
          </Alert>
        )}
      </Paper>
    </Wrapper>
  )
}
