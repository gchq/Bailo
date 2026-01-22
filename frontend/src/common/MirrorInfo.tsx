import { Stack, Typography } from '@mui/material'

export default function MirrorInfo() {
  return (
    <>
      <Stack spacing={1}>
        <Typography fontSize={16} fontWeight={'bold'}>
          Model export
        </Typography>
        <Typography>
          When exporting a model as a mirrored model, only the full model card history is included by default.
        </Typography>
        <Typography fontSize={16} fontWeight={'bold'}>
          Releases
        </Typography>
        <Typography>
          To include releases and their associated artefacts (files and images), you must explicitly select the required
          releases.
          <br />
          If a release is updated after export, it must be re-exported for those changes to appear on the mirrored
          model.
        </Typography>
        <Typography fontSize={16} fontWeight={'bold'}>
          Model artefacts
        </Typography>
        <Typography>
          Only artefacts (files and images) associated with the selected release(s) are exported and made available on
          the mirrored model. Releases are exported additively: exporting release 1.0.0 and then exporting release 2.0.0
          will result in both releases being available on the mirrored model.
          <br />
          All model artefacts must have a clean virus scan (if AV scanning is enabled) before they can be exported. If
          any artefact does not have a clean scan result, the export will fail.
        </Typography>
      </Stack>
    </>
  )
}
