import { List, ListItem, Typography } from '@mui/material'
import { EntryKind, EntryKindLabel } from 'types/types'

export default function SearchInfo() {
  function listEntryKinds(delimeter: string, plurality: boolean): string {
    let kinds: string = ''
    const ess = plurality ? 's' : ''
    for (const [_key, value] of Object.entries(EntryKind)) {
      let suffix = ''
      if (kinds !== '') {
        suffix += delimeter + EntryKindLabel[value] + ess
      } else {
        suffix += EntryKindLabel[value] + ess
      }
      kinds += suffix
    }
    return kinds
  }

  return (
    <>
      <Typography fontSize={16} fontWeight='bold'>
        Marketplace search
      </Typography>
      <List sx={{ listStyleType: 'disc', px: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <Typography>
            {`The advanced search input is used for filtering the marketplace for the current selected tab (${listEntryKinds(' or ', false)}). By default it uses a full document search, so it will also look through the data of the
            model card to find any items that exactly match your query. If you would like to query only on the title,
            toggle off the "Full text" button. This will search with a partial match on the title.`}
          </Typography>
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <Typography>Allows for additional granularity via specifying any of the following:</Typography>
          <ListItem sx={{ display: 'list-item', listStyleType: 'circle' }}>
            <Typography>
              &quot;My Roles&quot; will only display results whereby you hold the selected role for that item. It also
              contains an &quot;Any role&quot; option that will return results that you have been added to as a
              collaborator with any role.
            </Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item', listStyleType: 'circle' }}>
            <Typography>Task (this searches for specific tags on {listEntryKinds(' / ', true)})</Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item', listStyleType: 'circle' }}>
            <Typography>Libraries</Typography>
          </ListItem>
        </ListItem>
      </List>
      <Typography fontSize={16} fontWeight='bold'>
        Top-right search
      </Typography>
      <List sx={{ listStyleType: 'disc', px: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <Typography>
            Returns results of any type ({listEntryKinds(' and ', true)}) based on your search query
          </Typography>
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <Typography>No additional granularity</Typography>
        </ListItem>
      </List>
    </>
  )
}
