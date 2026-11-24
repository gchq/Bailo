import Email from '@mui/icons-material/Email'
import { IconButton, Tooltip } from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import { useMemo } from 'react'
import { type UserInformation } from 'src/common/UserDisplay'
import useSWR from 'swr'
import { EntryCardKindLabel, type EntryInterface } from 'types/types'
import { fetcher } from 'utils/fetcher'

const developerRoles = ['owner', 'contributor']

export function getEntitiesForRoles(entry: Pick<EntryInterface, 'collaborators'>, roles: string[]): string[] {
  return entry.collaborators
    .filter((collaborator) => collaborator.roles.some((role) => roles.includes(role)))
    .map((collaborator) => collaborator.entity)
}

const uniqueEmails = (emails: string[]) => [...new Map(emails.map((email) => [email.toLowerCase(), email])).values()]

export function buildEntryMessageHref(
  entry: Pick<EntryInterface, 'id' | 'name' | 'kind'>,
  to: string[],
  cc: string[],
): string {
  const toEmails = uniqueEmails(to)
  const toKeys = new Set(toEmails.map((email) => email.toLowerCase()))
  const ccEmails = uniqueEmails(cc).filter((email) => !toKeys.has(email.toLowerCase()))
  const cardLabel = EntryCardKindLabel[entry.kind]
  const params = [
    `subject=${encodeURIComponent(`Query regarding ${cardLabel.toLowerCase()} for ${entry.name} (${entry.id})`)}`,
    ...(ccEmails.length > 0 ? [`cc=${encodeURIComponent(ccEmails.join(','))}`] : []),
  ].join('&')

  return `mailto:${toEmails.join(',')}?${params}`
}

function useRecipientEmails(entities: string[]) {
  const keys = entities
    .filter((entity) => entity.startsWith('user:'))
    .map((entity) => `/api/v2/entity/${encodeURIComponent(entity.split(':')[1])}/lookup`)
  const { data, error, isLoading } = useSWR<UserInformation[], Error>(keys.length ? keys : null, async (urls) =>
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
  const { entryRoles, isEntryRolesLoading: rolesLoading, isEntryRolesError: rolesError } = useGetEntryRoles(entry.id)
  const reviewerRoles = useMemo(
    () => entryRoles.filter((role) => role.kind === 'review').map((role) => role.shortName),
    [entryRoles],
  )
  const developers = useMemo(() => getEntitiesForRoles(entry, developerRoles), [entry])
  const reviewers = useMemo(() => getEntitiesForRoles(entry, reviewerRoles), [entry, reviewerRoles])
  const developerRecipients = useRecipientEmails(developers)
  const reviewerRecipients = useRecipientEmails(reviewers)
  const loading = rolesLoading || developerRecipients.isLoading || reviewerRecipients.isLoading
  const hasError = rolesError || developerRecipients.error || reviewerRecipients.error
  const href =
    !loading && !hasError && developerRecipients.emails.length > 0
      ? buildEntryMessageHref(entry, developerRecipients.emails, reviewerRecipients.emails)
      : undefined

  if (!href) {
    return null
  }

  return (
    <Tooltip title={`Email about ${cardLabel.toLowerCase()}`}>
      <span>
        <IconButton color='primary' href={href} size='small' aria-label={`Email about ${cardLabel.toLowerCase()}`}>
          <Email />
        </IconButton>
      </span>
    </Tooltip>
  )
}
