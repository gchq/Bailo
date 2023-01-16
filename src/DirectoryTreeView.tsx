import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
import { useState, useCallback, useEffect } from 'react'
import { DirectoryArrayMetadata, DirectoryMetadata } from 'types/interfaces'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import useNotification from './common/Snackbar'
import { getEndpoint } from '../data/api'

export default function DirectoryTreeView({
  uuid,
  version,
  displayTree,
}: {
  uuid: string
  version: string
  displayTree: boolean
}) {
  const [treeResponse, setTreeResponse] = useState<DirectoryMetadata>()
  const [treeLoading, setTreeLoading] = useState(false)
  const sendNotification = useNotification()

  const getTreeResponse = useCallback(async () => {
    if (displayTree) {
      setTreeLoading(true)
      const response = await getEndpoint(`/api/v1/deployment/${uuid}/version/${version}/file-list`)
      if (response.status === 200) {
        const directoryArrayMetadata: DirectoryMetadata = await response.json()
        setTreeResponse(directoryArrayMetadata)
        setTreeLoading(false)
      } else {
        sendNotification({ variant: 'error', msg: 'Failed to retrieve file structure' })
      }
    }
  }, [uuid, version, sendNotification, displayTree])

  useEffect(() => {
    if (version) {
      getTreeResponse()
    }
  }, [version, getTreeResponse])

  function directoryTreeItem(tree: DirectoryMetadata | undefined, parentId: string) {
    let id = ''
    if (tree) {
      id = `${parentId}${tree.name}`
    }
    return (
      tree && (
        <TreeItem key={id} nodeId={id} label={`${tree.name}`}>
          {tree.children !== undefined && tree.children.map((child) => directoryTreeItem(child, id))}
          {tree.children !== undefined &&
            tree.children.map((file) => (
              <TreeItem key={`${id}${file.name}`} nodeId={`${id}${file}`} label={file.name} />
            ))}
        </TreeItem>
      )
    )
  }

  if (!displayTree) {
    return null
  }

  if (treeLoading) {
    return <div>Loading files...</div>
  }

  return (
    <TreeView defaultExpandIcon={<ChevronRightIcon />} defaultCollapseIcon={<ExpandLessIcon />}>
      {directoryTreeItem(treeResponse, '')}
    </TreeView>
  )
}
