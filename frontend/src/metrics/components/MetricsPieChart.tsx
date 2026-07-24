import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { mangoFusionPaletteDark } from '@mui/x-charts'
import { DefaultizedPieValueType } from '@mui/x-charts/models'
import { PieChart, pieClasses } from '@mui/x-charts/PieChart'
import { sortPieData } from 'utils/metricsUtils'

export interface PieChartData {
  label: string
  value: number
  color?: string
}

// Ensure the colour used for 'none' values is consistent across charts
export const noneColour = mangoFusionPaletteDark[0]

// Remaining palette, used for everything else
const remainingPalette = mangoFusionPaletteDark.filter((colour) => colour !== noneColour)

/**
 * Maps each pie data item to a colour, pinning 'none' to a
 * fixed palette colour and cycling the rest without repeats.
 */
function withConsistentColours<T extends PieChartData>(items: T[]): (T & { color: string })[] {
  let i = 0
  return items.map((item) => {
    if (item.label.toLowerCase() === 'none') {
      return { ...item, color: noneColour }
    }
    const color = remainingPalette[i % remainingPalette.length]
    i += 1
    return { ...item, color }
  })
}

interface OverviewPieChartProps {
  id: string
  title: string
  data: PieChartData[]
  onSelectItem: (label: string) => void
  width?: number
  height?: number
}

export function OverviewPieChart({ id, title, data, onSelectItem, width = 340, height = 250 }: OverviewPieChartProps) {
  const theme = useTheme()

  const handleItemClick = (item: DefaultizedPieValueType) => {
    const label = typeof item.label === 'function' ? item.label('arc') : (item.label ?? null)
    if (label) {
      onSelectItem(label)
    }
  }

  // Filter out items with zero count
  const filteredData = data.filter((item) => item.value >= 1)
  const chartData = withConsistentColours(sortPieData(filteredData))

  return (
    <Stack spacing={2} sx={{ alignItems: 'center' }}>
      <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
        {title}
      </Typography>
      <PieChart
        width={width}
        height={height}
        hideLegend
        margin={{ right: 5 }}
        colors={mangoFusionPaletteDark}
        sx={{
          [`& .${pieClasses.arcLabel}`]: {
            fontWeight: 'bold',
            color: theme.palette.common.white,
          },
          '& path': { cursor: 'pointer' },
        }}
        series={[
          {
            id,
            innerRadius: 50,
            outerRadius: 100,
            data: chartData,
            arcLabel: 'value',
            paddingAngle: 1,
            cornerRadius: 4,
            highlightScope: { fade: 'global', highlight: 'item' },
          },
        ]}
        onItemClick={(_event, _identifier, item) => handleItemClick(item)}
      />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2,
          minHeight: 48,
          maxWidth: width,
        }}
      >
        {chartData.map((item) => (
          <Box
            key={item.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                mb: '2px',
                backgroundColor: item.color,
                borderRadius: '50%',
              }}
            />
            <Typography variant='body2'>{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  )
}
