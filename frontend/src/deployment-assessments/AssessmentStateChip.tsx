import { Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DeploymentAssessmentStatusKeys } from 'src/hooks/useDeploymentAssessmentFilters'
import {
  DeploymentAssessmentInterface,
  DeploymentAssessmentState,
  DeploymentAssessmentStateKeys,
  DeploymentAssessmentSummary,
} from 'types/types'

const stateLabels: Record<DeploymentAssessmentStateKeys, string> = {
  [DeploymentAssessmentState.NEEDS_REVIEW]: 'Needs review',
  [DeploymentAssessmentState.REJECTED]: 'Rejected',
  [DeploymentAssessmentState.CHANGES_REQUESTED]: 'Changes requested',
  [DeploymentAssessmentState.APPROVED]: 'Approved',
}

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

  const state = assessment.state
  const isSelected = selectable && selectedState === state

  const palette = {
    [DeploymentAssessmentState.NEEDS_REVIEW]: {
      main: theme.palette.grey[600],
      contrastText: theme.palette.getContrastText(theme.palette.grey[600]),
    },
    [DeploymentAssessmentState.CHANGES_REQUESTED]: theme.palette.warning,
    [DeploymentAssessmentState.REJECTED]: theme.palette.error,
    [DeploymentAssessmentState.APPROVED]: theme.palette.success,
  }[state]

  return (
    <Chip
      label={stateLabels[state]}
      size='small'
      clickable={selectable}
      onClick={selectable ? () => onSelectedStateChange(isSelected ? undefined : state) : undefined}
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
