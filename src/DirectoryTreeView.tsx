import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
import { useState, useCallback, useEffect } from 'react'
import { DirectoryMetadata } from 'types/interfaces'
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

  if (treeLoading) {
    return <Typography>Fetching code files...</Typography>
  }

  return (
    <TreeView defaultExpandIcon={<ChevronRightIcon />} defaultCollapseIcon={<ExpandLessIcon />}>
      {treeResponse && TreeRender(treeResponse)}
    </TreeView>
  )
}

function TreeRender(data: DirectoryMetadata) {
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
