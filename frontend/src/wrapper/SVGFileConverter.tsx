import SvgIcon from '@mui/material/SvgIcon'

type SVGFileConverterProps = {
  path: string
  height?: string
  width?: string
}

export default function SVGFileConverter({ path }: SVGFileConverterProps) {
  return <SvgIcon>{path}</SvgIcon>
}
