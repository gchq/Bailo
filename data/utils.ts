import { SelectChangeEvent } from '@mui/material/Select'

export function setTargetValue(setFunc: (value: any) => void) {
  return function onChange(event: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<any>) {
    setFunc(event.target.value)
  }
}
