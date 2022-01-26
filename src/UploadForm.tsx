import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { withTheme } from '@rjsf/core'
import { Theme as MaterialUITheme } from 'src/MuiForms'

import FileInputs from 'src/UploadForm/FileInputs'

const Form = withTheme(MaterialUITheme)

export default function UploadForm({ schema, onUpload }: { schema: any; onUpload: any }) {
  const [codeFile, setCodeFile] = useState<File | undefined>(undefined)
  const [binaryFile, setBinaryFile] = useState<File | undefined>(undefined)
  const [metadata, setMetadata] = useState({})

  useEffect(() => {
    const propsToDelete = ['id', 'timeStamp', 'schemaRef', 'user']
    const newSchema = schema.schema
    propsToDelete.forEach((prop) => {
      delete newSchema.properties[prop]
      if (newSchema.required) {
        const index = newSchema.required.indexOf(prop)
        if (index > -1) {
          newSchema.required.splice(index, 1)
        }
      }
    })
    setMetadata(newSchema)
  }, [schema])

  const uploadModel = async () => {
    onUpload(codeFile, binaryFile, metadata)
  }

  const onCodeFileChange = (event: any) => {
    setCodeFile(event.target.files[0])
  }

  const onBinaryFileChange = (event: any) => {
    setBinaryFile(event.target.files[0])
  }

  // const getModelInstance = useCallback(async () => {
  //   if (!model) return

  //   const modelInstance = await fetch(`/api/v1/model/${model}`).then((res) => res.json())

  //   console.log(modelInstance, model)

  //   setSchema(modelInstance)
  //   setMetadata(JSON.stringify(modelInstance.currentMetadata, null, 4))

  //   const versionDoc = await fetch(`/api/v1/version/${modelInstance.versions[modelInstance.versions.length - 1]}`).then(
  //     (res) => res.json()
  //   )

  //   // get last digit in string...
  //   const versionRegex = versionDoc.version.match(/(.*)(\d)(.*)/)
  //   const newVersion = versionRegex[1] + (parseInt(versionRegex[2]) + 1) + versionRegex[3]

  //   setVersion(newVersion)
  // }, [model])

  // useEffect(() => {
  //   getModelInstance()
  // }, [getModelInstance, model])

  const onDataChange = (form: any) => {
    setMetadata(form.formData)
  }

  return (
    <>
      <Form schema={schema.schema} formData={metadata} onChange={onDataChange}>
        <React.Fragment />
      </Form>
      <FileInputs {...{ codeFile, onCodeFileChange, binaryFile, onBinaryFileChange }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button variant='contained' onClick={uploadModel} sx={{ mt: 3 }}>
          {'Upload'}
        </Button>
      </Box>
    </>
  )
}
