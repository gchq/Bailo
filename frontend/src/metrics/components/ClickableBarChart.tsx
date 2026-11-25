import { type SxProps, type Theme } from '@mui/material'
import { cheerfulFiestaPaletteDark } from '@mui/x-charts'
import { BarChart } from '@mui/x-charts/BarChart'

export interface BarSeries {
  key: string // property name in each data row
  label: string // text shown in the legend/tooltip
}

type Row = Record<string, string | number>

interface ClickableBarChartProps<T extends Row> {
  data: T[]
  categoryKey: keyof T & string // which property to use for the x axis
  series: BarSeries[]
  hideLegend?: boolean
  onBarGroupClick?: (row: T) => void
}

const chartSx: SxProps<Theme> = {
  cursor: 'pointer',
  '& .MuiBarElement-root': {
    transformBox: 'fill-box',
    transformOrigin: 'center bottom',
    transition: 'transform 0.15s, filter 0.15s',
  },
  '& .MuiChartsAxisHighlight-root': {
    fill: (theme) => theme.palette.action.hover,
    fillOpacity: 1,
  },
}

export function ClickableBarChart<T extends Row>({
  data,
  categoryKey,
  series,
  hideLegend = false,
  onBarGroupClick,
}: ClickableBarChartProps<T>) {
  return (
    <BarChart
      dataset={data}
      series={series.map(({ key, label }) => ({ dataKey: key, label }))}
      xAxis={[{ dataKey: categoryKey }]}
      axisHighlight={{ x: 'band' }}
      onAxisClick={(_, params) => {
        const row = params?.dataIndex == null ? undefined : data[params.dataIndex]
        if (row) {
          onBarGroupClick?.(row)
        }
      }}
      height={250}
      margin={{ left: 0 }}
      yAxis={[{ width: 50 }]}
      colors={cheerfulFiestaPaletteDark}
      borderRadius={2}
      hideLegend={hideLegend}
      sx={chartSx}
    />
  )
}
