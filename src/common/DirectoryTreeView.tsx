import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
import { useState, useCallback, useEffect } from 'react'
import { DirectoryArrayMetadata } from 'server/routes/v1/deployment'
import Chip from '@mui/material/Chip'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import useNotification from './Snackbar'
import { getEndpoint } from '../../data/api'

export default function DirectoryTreeView({
  uuid,
  version,
  fileType,
}: {
  uuid: string
  version: string
  fileType: string
}) {
  const [treeResponse, setTreeResponse] = useState<DirectoryArrayMetadata>()
  const [displayTree, setDisplayTree] = useState<boolean>(false)
  const [treeLoaded, setTreeLoaded] = useState<boolean>(false)
  const sendNotification = useNotification()

  const getTreeResponse = useCallback(async () => {
    if (displayTree) {
      const response = await getEndpoint(`/api/v1/deployment/${uuid}/version/${version}/list/${fileType}`)
      if (response.status === 200) {
        const directoryArrayMetadata: DirectoryArrayMetadata = await response.json()
        setTreeResponse(directoryArrayMetadata)
        setTreeLoaded(true)
      } else {
        sendNotification({ variant: 'error', msg: 'Failed to retrieve file structure' })
      }
    }
  }, [uuid, version, fileType, sendNotification, displayTree])

  useEffect(() => {
    if (version) {
      getTreeResponse()
    }
  }, [version, getTreeResponse])

  const handleButtonClick = () => {
    setDisplayTree(true)
  }

  function directoryTreeItem(tree: DirectoryArrayMetadata | undefined, parentId: string) {
    let id = ''
    if (tree) {
      id = `${parentId}${tree.name}`
    }
    return (
      tree && (
        <TreeItem key={`${id}`} nodeId={`${id}`} label={`${tree.name}`}>
          {console.log(`nodeId=${id} label=${tree.name}`)}
          {tree.directories.map((child) => directoryTreeItem(child, id))}
          {tree.files.map((file) => {
            console.log(`nodeId=${id}${file} label=${file}`)
            return <TreeItem key={`${id}${file}`} nodeId={`${id}${file}`} label={`${file}`} />
          })}
        </TreeItem>
      )
    )
  }

  // eslint-disable-next-line no-nested-ternary
  return treeLoaded ? (
    <TreeView
      aria-label={`${fileType} file list`}
      defaultExpandIcon={<ChevronRightIcon />}
      defaultCollapseIcon={<ExpandLessIcon />}
    >
      {directoryTreeItem(treeResponse, '')}
    </TreeView>
  ) : displayTree ? (
    <Chip label='Loading File Tree..' avatar={<AccountTreeIcon />} />
  ) : (
    <Chip label='Show File Tree' onClick={handleButtonClick} avatar={<AccountTreeIcon />} />
  )
}
