import Email from '@mui/icons-material/Email'
import { IconButton, Tooltip } from '@mui/material'
import { useMemo } from 'react'
import { type UserInformation } from 'src/common/UserDisplay'
import useSWR from 'swr'
import { EntryCardKindLabel, type EntryInterface } from 'types/types'
import { fetcher } from 'utils/fetcher'

const developerRoles = ['owner', 'contributor']
const reviewerRoles = ['mtr', 'msro']

export function getEntitiesForRoles(entry: Pick<EntryInterface, 'collaborators'>, roles: string[]): string[] {
  return entry.collaborators
    .filter((collaborator) => collaborator.roles.some((role) => roles.includes(role)))
    .map((collaborator) => collaborator.entity)
}

export function buildEntryMessageHref(
  entry: Pick<EntryInterface, 'id' | 'name' | 'kind'>,
  to: string,
  cc: string,
): string {
  const cardLabel = EntryCardKindLabel[entry.kind]
  const subject = encodeURIComponent(`Query regarding ${cardLabel.toLowerCase()} for ${entry.name} (${entry.id})`)

  return `mailto:${to}?cc=${encodeURIComponent(cc)}&subject=${subject}`
}

function useRecipientEmails(entities: string[]) {
  const keys = entities.map((entity) => `/api/v2/entity/${encodeURIComponent(entity.split(':')[1] ?? entity)}/lookup`)
  const { data, error, isLoading } = useSWR<UserInformation[]>(keys.length ? keys : null, async (urls) =>
    Promise.all(urls.map((url) => fetcher(url).then((response: { entity: UserInformation }) => response.entity))),
  )

  return {
    emails: data?.flatMap((information) => (information.email ? [information.email] : [])) ?? [],
    isLoading,
    error,
  }
}

export default function EntryMessageButtons({
  entry,
}: {
  entry: Pick<EntryInterface, 'id' | 'name' | 'kind' | 'collaborators'>
}) {
  const cardLabel = EntryCardKindLabel[entry.kind]
  const developers = useMemo(() => getEntitiesForRoles(entry, developerRoles), [entry])
  const reviewers = useMemo(() => getEntitiesForRoles(entry, reviewerRoles), [entry])
  const developerRecipients = useRecipientEmails(developers)
  const reviewerRecipients = useRecipientEmails(reviewers)
  const loading = developerRecipients.isLoading || reviewerRecipients.isLoading
  const hasError = developerRecipients.error || reviewerRecipients.error
  const href =
    !loading && !hasError && developerRecipients.emails.length > 0
      ? buildEntryMessageHref(entry, developerRecipients.emails.join(','), reviewerRecipients.emails.join(','))
      : undefined

  return (
    <Tooltip title={`Email about ${cardLabel.toLowerCase()}`}>
      <IconButton
        color='primary'
        {...(href ? { href } : {})}
        disabled={!href}
        size='small'
        aria-label={`Email about ${cardLabel.toLowerCase()}`}
      >
        <Email />
      </IconButton>
    </Tooltip>
  )
}
