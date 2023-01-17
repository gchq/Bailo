import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
import { useState, useCallback, useEffect } from 'react'
import { FileOrDirectoryMetadata } from 'types/interfaces'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { Typography } from '@mui/material'
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
  const [fileList, setFileList] = useState<FileOrDirectoryMetadata>()
  const [treeLoading, setTreeLoading] = useState(false)
  const sendNotification = useNotification()

  const getFileList = useCallback(async () => {
    if (displayTree) {
      setTreeLoading(true)
      const response = await getEndpoint(`/api/v1/deployment/${uuid}/version/${version}/file-list`)
      if (response.status === 200) {
        const fileOrDirectoryMetadata: FileOrDirectoryMetadata = await response.json()
        setFileList(fileOrDirectoryMetadata)
        setTreeLoading(false)
      } else {
        sendNotification({ variant: 'error', msg: 'Failed to retrieve file structure' })
      }
    }
  }, [uuid, version, sendNotification, displayTree])

  useEffect(() => {
    if (version) {
      getFileList()
    }
  }, [version, getFileList])

  if (treeLoading || !fileList) {
    return <Typography>Fetching code files...</Typography>
  }

  return (
    <TreeView defaultExpandIcon={<ChevronRightIcon />} defaultCollapseIcon={<ExpandLessIcon />}>
      {TreeRender(fileList)}
    </TreeView>
  )
}

function TreeRender(data: FileOrDirectoryMetadata) {
  const { name, children, id } = data
  if (Array.isArray(children)) {
    return (
      <TreeItem key={id} nodeId={id} label={name}>
        {children.map((treeNode, _idx) => TreeRender(treeNode))}
      </TreeItem>
    )
  }
  return <TreeItem key={id} nodeId={id} label={name} />
}
