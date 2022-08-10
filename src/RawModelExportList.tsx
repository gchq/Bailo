import { useGetModelById, useGetModelVersions } from '@/data/model'
import { Deployment } from '@/types/interfaces'
import Typography from '@mui/material/Typography'
import Box from '@mui/system/Box'
import React from 'react'
import { VersionDoc } from 'server/models/Version'

const RawModelExportList = ({deployment}: {deployment: Deployment}) => {

  const { model } = useGetModelById(deployment.model.toString())
  const { versions, isVersionsLoading, isVersionsError } = useGetModelVersions(model?.uuid)

  console.log(versions)
  
  return (
    <>
      {!isVersionsLoading && !isVersionsError && versions?.map((version: any) => {
        if (version?.buildOptions?.rawModelExport) {
          return (
            <>
              <Box>
                <Typography>{version.version}</Typography>
              </Box>
            </>
          )
        }
      })}
    </>
  )

}

export default RawModelExportList