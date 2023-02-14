import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import TreeView from '@mui/lab/TreeView'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Grid from '@mui/material/Grid'
import TreeItem from '@mui/lab/TreeItem'
import { useGetVersionFile, useGetVersionFileList } from '@/data/version'
import { filesArrayToTree, RenderTree } from '@/utils/tree'
import dynamic from 'next/dynamic'
import '@uiw/react-textarea-code-editor/dist.css'

const CodeEditor = dynamic(() => import('@uiw/react-textarea-code-editor').then((mod) => mod.default), { ssr: false })

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
    <Grid container spacing={2}>
      <Grid item xs={12} md={3} sx={{ maxHeight: 'inherit' }}>
        <TreeView
          aria-label='code navigator'
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          defaultExpanded={['code/']}
          sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 'inherit' }}
        >
          {renderTree(tree)}
        </TreeView>
      </Grid>
      <Grid item xs={12} md={9} sx={{ scroll: 'auto', height: '100%' }}>
        <CodeEditor
          value={file}
          language={path ? path.split('.').at(-1) : 'py'}
          padding={15}
          data-color-mode={theme.palette.mode === 'dark' ? 'dark' : 'light'}
          style={{
            fontSize: theme.typography.fontSize,
            backgroundColor: 'inherit',
            fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
          }}
        />
      </Grid>
    </Grid>
  )
}
