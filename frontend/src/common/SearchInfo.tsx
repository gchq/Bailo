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
      <Typography fontSize={16} fontWeight={'bold'}>
        Marketplace search
      </Typography>
      <List sx={{ listStyleType: 'disc', px: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <Typography>
            Searches across all entry kinds ({listEntryKinds(' or ', false)}), but a user can only see the results based
            on the tab they are currenly on (either {listEntryKinds(' or ', true)})
          </Typography>
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <Typography>Allows for additional granularity via specifying any of the following:</Typography>
          <ListItem sx={{ display: 'list-item', listStyleType: 'circle' }}>
            <Typography>Filters (e.g. only show models that I have created)</Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item', listStyleType: 'circle' }}>
            <Typography>Task (this searches for specific tags on {listEntryKinds('/', true)})</Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item', listStyleType: 'circle' }}>
            <Typography>Libraries</Typography>
          </ListItem>
        </ListItem>
      </List>
      <Typography fontSize={16} fontWeight={'bold'}>
        Top-right search
      </Typography>
      <List sx={{ listStyleType: 'disc', px: 3 }}>
        <ListItem sx={{ display: 'list-item' }}>
          <Typography>Searches across all entry kinds ({listEntryKinds(' and ', true)})</Typography>
        </ListItem>
        <ListItem sx={{ display: 'list-item' }}>
          <Typography>No additional granularity</Typography>
        </ListItem>
      </List>
    </>
  )
}
