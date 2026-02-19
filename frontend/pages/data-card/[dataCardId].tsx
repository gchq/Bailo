import { useGetEntry } from 'actions/entry'
import { useRouter } from 'next/router'
import { useContext, useMemo } from 'react'
import Loading from 'src/common/Loading'
import PageWithTabs, { PageTab } from 'src/common/PageWithTabs'
import Title from 'src/common/Title'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import Overview from 'src/entry/Overview'
import Settings from 'src/entry/settings/Settings'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { EntryKind } from 'types/types'

export default function DataCard() {
  const router = useRouter()
  const { dataCardId }: { dataCardId?: string } = router.query
  const {
    entry: dataCard,
    isEntryLoading: isDataCardLoading,
    isEntryError: isDataCardError,
    mutateEntry: mutateEntry,
  } = useGetEntry(dataCardId, EntryKind.DATA_CARD)

  const { userPermissions } = useContext(UserPermissionsContext)

  const settingsPermission = useMemo(() => userPermissions['editEntry'], [userPermissions])

  const tabs: PageTab[] = useMemo(
    () =>
      dataCard
        ? [
            {
              title: 'Overview',
              path: 'overview',
              view: <Overview entry={dataCard} mutateEntry={mutateEntry} />,
            },
            {
              title: 'Settings',
              path: 'settings',
              disabled: !settingsPermission.hasPermission,
              disabledText: settingsPermission.info,
              view: <Settings entry={dataCard} />,
            },
          ]
        : [],
    [dataCard, mutateEntry, settingsPermission.hasPermission, settingsPermission.info],
  )

  const error = MultipleErrorWrapper(`Unable to load data card page`, {
    isDataCardError,
  })
  if (error) {
    return error
  }

  return (
    <>
      <Title text={dataCard ? dataCard.name : 'Loading...'} />
      {!dataCard || isDataCardLoading ? (
        <Loading />
      ) : (
        <PageWithTabs
          title={dataCard.name}
          additionalInfo={dataCard.description}
          subheading={`ID: ${dataCard.id}`}
          tabs={tabs}
          requiredUrlParams={{ dataCardId: dataCard.id }}
          titleToCopy={dataCard.name}
          subheadingToCopy={dataCard.id}
        />
      )}
    </>
  )
}
