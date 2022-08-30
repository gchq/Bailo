import { FormProps, withTheme } from '@rjsf/core'
import { FunctionComponent } from 'react'
import Theme from '../Theme'

const MuiForm: React.ComponentClass<FormProps<any>> | FunctionComponent<FormProps<any>> = withTheme(Theme)

export default MuiForm
