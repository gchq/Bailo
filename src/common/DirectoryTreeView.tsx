/* eslint-disable no-param-reassign */
import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
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
  function directoryTreeItem(name: string, directories: any[], files: string[], currentNodeId: number) {
    return (
      <TreeItem nodeId={`${currentNodeId}`} label={`${name}`}>
        {directories.forEach((child) => {
          currentNodeId += 1
          return directoryTreeItem(child.name, child.directories, child.files, currentNodeId)
        })}
        {files.forEach((file) => {
          currentNodeId += 1
          return <TreeItem nodeId={`${currentNodeId}`} label={`${file}`} />
        })}
      </TreeItem>
    )
  }

  const directoryTreeItemRoot = async () => {
    const res = await getEndpoint(`/api/v1/deployment/${uuid}/version/${version}/list/${fileType}`)
    const json = await res.json()
    return directoryTreeItem(json.name, json.directories, json.files, 1)
  }

  return <TreeView>{directoryTreeItemRoot()}</TreeView>
}
