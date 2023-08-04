import React, { Dispatch, SetStateAction } from 'react'

import { SplitSchema } from '../../types/interfaces'
import FormDesigner from './FormDesignerBeta'

export default function Form({
  splitSchema,
  setSplitSchema,
  onSubmit,
  modelUploading = false,
  canEdit = false,
}: {
  splitSchema: SplitSchema
  onSubmit: () => void
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
  modelUploading?: boolean
  canEdit?: boolean
}) {
  return (
    <>
      <FormDesigner
        splitSchema={splitSchema}
        setSplitSchema={setSplitSchema}
        onSubmit={onSubmit}
        modelUploading={modelUploading}
        canEdit={canEdit}
      />
    </>
  )
}
