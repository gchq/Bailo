import Editor from '@monaco-editor/react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import TreeView from '@mui/lab/TreeView'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Grid from '@mui/material/Grid'
import TreeItem from '@mui/lab/TreeItem'
import { useGetVersionFile, useGetVersionFileList } from '@/data/version'
import { filesArrayToTree, RenderTree } from '@/utils/tree'

export default function CodeExplorer({
  id,
  addQueryParameter,
}: {
  id: string
  addQueryParameter: (key: string, value: string) => void
}) {
  const [path, setPath] = useState<string | undefined>(undefined)
  const { fileList } = useGetVersionFileList(id)
  const { file } = useGetVersionFile(id, path)
  const theme = useTheme()

  const changePath = useCallback(
    (newPath: string) => {
      addQueryParameter('path', newPath)
      setPath(newPath)
    },
    [addQueryParameter]
  )

  const tree: RenderTree = useMemo(() => {
    if (!fileList) {
      return {
        id: '',
        name: '',
      }
    }

    return filesArrayToTree(fileList.fileList)
  }, [fileList])

  useEffect(() => {
    if (path || !fileList?.fileList?.length) {
      return
    }

    changePath(fileList.fileList[0].fileName)
  }, [fileList, changePath, path])

  const renderTree = (nodes: RenderTree) => (
    <TreeItem
      key={nodes.id}
      nodeId={nodes.id}
      label={nodes.name}
      onClick={() => {
        if (!nodes.id.endsWith('/')) {
          changePath(nodes.id)
        }
      }}
    >
      {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
  )

  return (
    <Box>
      <Grid container spacing={2} sx={{ maxHeight: '100%' }}>
        <Grid item xs={12} md={3} sx={{ scroll: 'auto' }}>
          <TreeView
            aria-label='code navigator'
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            defaultExpanded={['code/']}
            sx={{ flexGrow: 1, overflowY: 'auto' }}
          >
            {renderTree(tree)}
          </TreeView>
        </Grid>
        <Grid item xs={12} md={9} sx={{ scroll: 'auto' }}>
          <Editor
            height='80vh'
            path={path}
            value={file}
            theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
            options={{ fontSize: theme.typography.fontSize }}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
