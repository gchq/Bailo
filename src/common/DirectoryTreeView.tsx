import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
import { useState, useCallback, useEffect } from 'react'
import { DirectoryArrayMetadata } from 'server/routes/v1/deployment'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import useNotification from './Snackbar'
import { getEndpoint } from '../../data/api'

export default function DirectoryTreeView({
  uuid,
  version,
  fileType,
  displayTree,
}: {
  uuid: string
  version: string
  fileType: string
  displayTree: boolean
}) {
  const [treeResponse, setTreeResponse] = useState<DirectoryArrayMetadata>()
  const [treeLoading, setTreeLoading] = useState(false)
  const sendNotification = useNotification()

  const getTreeResponse = useCallback(async () => {
    if (displayTree) {
      setTreeLoading(true)
      const response = await getEndpoint(`/api/v1/deployment/${uuid}/version/${version}/list/${fileType}`)
      if (response.status === 200) {
        const directoryArrayMetadata: DirectoryArrayMetadata = await response.json()
        setTreeResponse(directoryArrayMetadata)
        setTreeLoading(false)
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

  function directoryTreeItem(tree: DirectoryArrayMetadata | undefined, parentId: string) {
    let id = ''
    if (tree) {
      id = `${parentId}${tree.name}`
    }
    return (
      tree && (
        <TreeItem key={`${id}`} nodeId={`${id}`} label={`${tree.name}`}>
          {tree.directories.map((child) => directoryTreeItem(child, id))}
          {tree.files.map((file) => (
            <TreeItem key={`${id}${file}`} nodeId={`${id}${file}`} label={`${file}`} />
          ))}
        </TreeItem>
      )
    )
  }

  if (!displayTree) {
    return null
  }

  if (treeLoading) {
    return <div>Loading file tree...</div>
  }

  return (
    <TreeView
      aria-label={`${fileType} file list`}
      defaultExpandIcon={<ChevronRightIcon />}
      defaultCollapseIcon={<ExpandLessIcon />}
    >
      {directoryTreeItem(treeResponse, '')}
    </TreeView>
  )
}
