import CreateNewFolder from '@mui/icons-material/CreateNewFolder'
import Delete from '@mui/icons-material/Delete'
import Folder from '@mui/icons-material/Folder'
import MoreVert from '@mui/icons-material/MoreVert'
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material'
import { deleteEntryFiles, useGetModelFiles } from 'actions/entry'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import FolderNavigableList from 'src/common/FolderNavigableList'
import DeleteConfirmationDialog from 'src/entry/model/files/DeleteConfirmationDialog'
import FileDisplay, { MutateFiles, MutateReleases } from 'src/entry/model/files/FileDisplay'
import useNotification from 'src/hooks/useNotification'
import { EntryKind, FileInterface, ReleaseInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { collectAllFiles, countMatchingFiles, type FileTreeNode, isFolderMarker } from 'utils/fileTreeUtils'
import { plural } from 'utils/stringUtils'

interface FileBrowserProps {
  files: FileInterface[]
  modelId: string
  modelKind?: string
  releases: ReleaseInterface[]
  mutator?: MutateFiles | MutateReleases
  readOnly?: boolean
  onCreatePath?: (currentPath: string) => void
  onPathChange?: (currentPath: string) => void
}

export default function FileBrowser({
  files,
  modelId,
  modelKind,
  releases,
  mutator,
  readOnly = false,
  onCreatePath,
  onPathChange,
}: FileBrowserProps) {
  return (
    <FolderNavigableList
      files={files}
      onPathChange={onPathChange}
      toolbarActions={({ currentPath }) =>
        onCreatePath && !readOnly ? (
          <Tooltip title='Create folder path'>
            <IconButton size='small' onClick={() => onCreatePath(currentPath)} data-test='createPathButton'>
              <CreateNewFolder fontSize='small' />
            </IconButton>
          </Tooltip>
        ) : null
      }
    >
      {({ data, onNavigate, searchQuery }) => {
        if (data.kind === 'folder') {
          return (
            <FolderRow
              node={data.node}
              modelId={modelId}
              modelKind={modelKind}
              releases={releases}
              readOnly={readOnly}
              onNavigate={onNavigate}
              searchQuery={searchQuery}
            />
          )
        }
        return (
          <FileDisplay
            showMenuItems={{
              associatedReleases: !readOnly,
              deleteFile: !readOnly && modelKind === EntryKind.MODEL,
              rescanFile: !readOnly,
            }}
            file={data.file}
            modelId={modelId}
            mutator={mutator}
            releases={releases}
            displayName={data.file.name.includes('/') ? data.file.name.split('/').pop() : undefined}
          />
        )
      }}
    </FolderNavigableList>
  )
}

function FolderRow({
  node,
  modelId,
  modelKind,
  releases,
  readOnly,
  onNavigate,
  searchQuery = '',
}: {
  node: FileTreeNode
  modelId: string
  modelKind?: string
  releases: ReleaseInterface[]
  readOnly: boolean
  onNavigate: (path: string) => void
  searchQuery?: string
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const sendNotification = useNotification()
  const { modelFiles, mutateModelFiles } = useGetModelFiles(modelId)
  const router = useRouter()

  const allFilesInFolder = useMemo(() => collectAllFiles(node), [node])

  const folderMarkers = useMemo(
    () =>
      modelFiles.filter(
        (f) => isFolderMarker(f) && (f.name === `${node.fullPath}/.folder` || f.name.startsWith(`${node.fullPath}/`)),
      ),
    [modelFiles, node.fullPath],
  )

  const associatedReleases = useMemo(
    () => releases.filter((release) => allFilesInFolder.some((file) => release.fileIds.includes(file._id))),
    [releases, allFilesInFolder],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (isDeleting) {
      return
    }
    try {
      setIsDeleting(true)
      setDeleteError('')
      const allFileIds = [...allFilesInFolder, ...folderMarkers].map((file) => file._id)
      const res = await deleteEntryFiles(modelId, allFileIds)
      if (!res.ok) {
        setDeleteError(await getErrorMessage(res))
        return
      }
      sendNotification({
        variant: 'success',
        msg: `Folder "${node.name}" and ${allFilesInFolder.length} file(s) deleted`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      mutateModelFiles()
      setDeleteOpen(false)
      router.push(`/model/${modelId}?tab=files`)
    } catch (err) {
      setDeleteError(`Failed to delete folder.\n${err}`)
    } finally {
      setIsDeleting(false)
    }
  }, [isDeleting, allFilesInFolder, folderMarkers, modelId, node.name, sendNotification, mutateModelFiles, router])

  const canDelete = !readOnly && modelKind === EntryKind.MODEL
  const matchingCount = useMemo(() => countMatchingFiles(node, searchQuery), [node, searchQuery])
  const totalCount = node.totalFileCount

  return (
    <Box sx={{ p: 1, width: '100%' }}>
      <Stack
        direction={{ sm: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
      >
        <Stack
          direction='row'
          spacing={2}
          sx={{ alignItems: 'center', cursor: 'pointer', flex: 1 }}
          onClick={() => onNavigate(node.fullPath)}
        >
          <Folder color='action' />
          <Typography variant='h6'>{node.name}</Typography>
          <Typography variant='caption' sx={{ width: 'max-content' }}>
            {searchQuery && matchingCount !== totalCount
              ? `${matchingCount} of ${plural(totalCount, 'file')} match`
              : `${plural(totalCount, 'file')}`}
          </Typography>
        </Stack>
        {canDelete && (
          <>
            <IconButton
              size='small'
              onClick={(e) => setAnchorEl(e.currentTarget)}
              data-test={`folder-menu-${node.name}`}
            >
              <MoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null)
                  setDeleteOpen(true)
                }}
              >
                <ListItemIcon>
                  <Delete color='error' fontSize='small' />
                </ListItemIcon>
                <ListItemText>Delete folder</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Stack>
      <DeleteConfirmationDialog
        open={deleteOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
        confirmLoading={isDeleting}
        errorMessage={deleteError}
        itemName={node.name}
        itemType='folder'
        associatedReleases={associatedReleases}
        allReleases={releases}
        modelId={modelId}
        filesToDelete={allFilesInFolder}
      />
    </Box>
  )
}
