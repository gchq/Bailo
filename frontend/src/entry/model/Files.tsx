import { useGetModelFiles } from 'actions/model'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import FileDownload from 'src/entry/model/releases/FileDownload'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

type FilesProps = {
  model: EntryInterface
}

export default function Files({ model }: FilesProps) {
  const { entryFiles, isEntryFilesLoading, isEntryFilesError } = useGetModelFiles(model.id)

  const entryFilesList = useMemo(
    () =>
      entryFiles.length ? (
        entryFiles.map((file) => (
          <FileDownload key={file.name} file={file} modelId={model.id} showAssociatedReleases={true} />
        ))
      ) : (
        <EmptyBlob text={`No files found for model ${model.name}`} />
      ),
    [entryFiles, model.id, model.name],
  )

  if (isEntryFilesError) {
    return <MessageAlert message={isEntryFilesError.info.message} severity='error' />
  }

  return (
    <>
      {isEntryFilesLoading && <Loading />}
      {entryFilesList}
    </>
  )
}
