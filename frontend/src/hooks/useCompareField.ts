import { Registry } from '@rjsf/utils'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

export interface CompareFieldState<T> {
  mirroredState: T | undefined
  compareFromState: T | undefined
  compareFromMirroredState: T | undefined
  inCompareMode: boolean
  isMirroredModel: boolean
  inMirroredCompare: boolean
  editMode: boolean
}

export default function getCompareFieldState<T = unknown>(
  id: string,
  formContext: Registry['formContext'],
): CompareFieldState<T> {
  const mirroredState = getMirroredState(id, formContext) as T | undefined
  const compareFromState = getCompareFromState(id, formContext) as T | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, formContext) as T | undefined
  const inCompareMode = !!formContext.compareMode && !formContext.editMode
  const isMirroredModel = !!formContext.mirroredModel
  const editMode = !!formContext.editMode

  return {
    mirroredState,
    compareFromState,
    compareFromMirroredState,
    inCompareMode,
    isMirroredModel,
    inMirroredCompare: inCompareMode && isMirroredModel,
    editMode,
  }
}
