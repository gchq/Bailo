import Email from '@mui/icons-material/Email'
import { IconButton, Tooltip } from '@mui/material'
import { type UserInformation } from 'src/common/UserDisplay'
import useSWR from 'swr'
import { DeploymentAssessmentInterface } from 'types/types'
import { fetcher } from 'utils/fetcher'

export function getRiskOwnerEntities(deploymentAssessment: Pick<DeploymentAssessmentInterface, 'metadata'>): string[] {
  return deploymentAssessment.metadata.signOff?.riskOwners ?? []
}

export function buildDeploymentAssessmentEmailHref(
  deploymentAssessment: Pick<DeploymentAssessmentInterface, 'id' | 'name'>,
  recipients: string[],
): string {
  const subject = encodeURIComponent(
    `Query regarding deployment assessment for ${deploymentAssessment.name} (${deploymentAssessment.id})`,
  )
    .replaceAll('(', '%28')
    .replaceAll(')', '%29')
  return `mailto:${recipients.join(',')}?subject=${subject}`
}

export default function DeploymentAssessmentEmailButton({
  deploymentAssessment,
}: {
  deploymentAssessment: DeploymentAssessmentInterface
}) {
  const riskOwners = getRiskOwnerEntities(deploymentAssessment)
  const keys = riskOwners.map((entity) => `/api/v2/entity/${encodeURIComponent(entity.split(':')[1] ?? entity)}/lookup`)
  const { data, error, isLoading } = useSWR<UserInformation[], Error>(keys.length ? keys : null, async (urls) =>
    Promise.all(urls.map((url) => fetcher(url).then((response: { entity: UserInformation }) => response.entity))),
  )
  const recipients = data?.flatMap((information) => (information.email ? [information.email] : [])) ?? []
  const href =
    !isLoading && !error && recipients.length > 0
      ? buildDeploymentAssessmentEmailHref(deploymentAssessment, recipients)
      : undefined

  return (
    <Tooltip title='Email risk owners about this deployment assessment'>
      <span>
        <IconButton
          color='primary'
          {...(href ? { href } : {})}
          disabled={!href}
          size='small'
          aria-label='Email risk owners about this deployment assessment'
        >
          <Email />
        </IconButton>
      </span>
    </Tooltip>
  )
}
