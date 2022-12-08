/* eslint-disable no-param-reassign */
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
  const currentNodeId = 0

  const getTreeResponse = useCallback(async () => {
    if (displayTree) {
      const response = await getEndpoint(`/api/v1/deployment/${uuid}/version/${version}/list/${fileType}`)
      if (response.status === 200) {
        const directoryArrayMetadata: DirectoryArrayMetadata = await response.json()
        setTreeResponse(directoryArrayMetadata)
        setTreeLoaded(true)
        console.log(directoryArrayMetadata)
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

  function directoryTreeItem(tree: DirectoryArrayMetadata | undefined, currentNodeId: number) {
    return (
      tree && (
        <TreeItem nodeId={`${currentNodeId}`} label={`${tree.name}`}>
          {console.log(`nodeId=${currentNodeId} label=${tree.name}`)}
          {tree.directories.map((child) => {
            currentNodeId += 1
            return directoryTreeItem(child, currentNodeId)
          })}
          {tree.files.map((file) => {
            currentNodeId += 1
            console.log(`nodeId=${currentNodeId} label=${file}`)
            return <TreeItem nodeId={`${currentNodeId}`} label={`${file}`} />
          })}
        </TreeItem>
      )
    )
  }

  currentNodeId = 1
  // eslint-disable-next-line no-nested-ternary
  return treeLoaded ? (
    <TreeView defaultExpandIcon={<ChevronRightIcon />} defaultCollapseIcon={<ExpandLessIcon />}>
      {directoryTreeItem(treeResponse, 1)}
    </TreeView>
  ) : displayTree ? (
    <Chip label='Loading File Tree..' avatar={<AccountTreeIcon />} />
  ) : (
    <Chip label='Show File Tree' onClick={handleButtonClick} avatar={<AccountTreeIcon />} />
  )
}
