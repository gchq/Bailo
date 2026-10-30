import { Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DeploymentAssessmentStatusKeys } from 'src/hooks/useDeploymentAssessmentFilters'
import { DeploymentAssessmentInterface, DeploymentAssessmentSummary } from 'types/types'

interface AssessmentStateChipProps {
  assessment: DeploymentAssessmentSummary | DeploymentAssessmentInterface
  selectedState?: DeploymentAssessmentStatusKeys
  onSelectedStateChange?: (state?: DeploymentAssessmentStatusKeys) => void
}

export default function AssessmentStateChip({
  assessment,
  selectedState,
  onSelectedStateChange,
}: AssessmentStateChipProps) {
  const theme = useTheme()
  const selectable = onSelectedStateChange !== undefined

  if (assessment.draft) {
    const isSelected = selectable && selectedState === 'draft'

    return (
      <Chip
        data-test='deploymentAssessmentStateChip'
        label='Draft'
        size='small'
        clickable={selectable}
        onClick={selectable ? () => onSelectedStateChange(isSelected ? undefined : 'draft') : undefined}
        variant={selectable && !isSelected ? 'outlined' : 'filled'}
        sx={{
          backgroundColor: selectable && !isSelected ? 'transparent' : theme.palette.info.main,
          color: selectable && !isSelected ? theme.palette.info.main : theme.palette.info.contrastText,
          borderColor: theme.palette.info.main,
          '&.MuiChip-clickable:hover': {
            backgroundColor: theme.palette.info.main,
            color: theme.palette.info.contrastText,
          },
        }}
      />
    )
  }

  const isSelected = selectable && selectedState === 'published'
  const palette = theme.palette.success

  return (
    <Chip
      data-test='deploymentAssessmentStateChip'
      label='Published'
      size='small'
      clickable={selectable}
      onClick={selectable ? () => onSelectedStateChange(isSelected ? undefined : 'published') : undefined}
      variant={selectable && !isSelected ? 'outlined' : 'filled'}
      sx={{
        backgroundColor: selectable && !isSelected ? 'transparent' : palette.main,
        color: selectable && !isSelected ? palette.main : palette.contrastText,
        borderColor: palette.main,
        '&.MuiChip-clickable:hover': {
          backgroundColor: palette.main,
          color: palette.contrastText,
        },
      }}
    />
  )
}
