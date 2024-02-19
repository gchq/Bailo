// import { TabPanel } from '@mui/lab'
// import Box from '@mui/material/Box'
// import Tab from '@mui/material/Tab'
// import Tabs from '@mui/material/Tabs'
// import Typography from '@mui/material/Typography'
// import React from 'react'

// interface TabProps {
//   label: string
//   children: React.ReactNode
// }

// interface SimpleTabProps {
//   tabs: TabProps[]
// }

// export default function SimpleTabs({ tabs }: SimpleTabProps) {
//   const [value, setValue] = React.useState(0)

//   const handleChange = (event, newValue) => {
//     setValue(newValue)
//   }
//   function a11yProps(index: number) {
//     return {
//       id: `vertical-tab-${index}`,
//       'aria-controls': `vertical-tabpanel-${index}`,
//     }
//   }

//   return (
//     <Box sx={{ width: '100%' }}>
//       <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
//         <Tabs value={value} onChange={handleChange} aria-label=' tabs'>
//           {tabs.map((tab, index) => (
//              <Tab label={tab.label} key={...a11yProps(index)} />
//           ))}
//         </Tabs>
//       </Box>
//       {tabs.map(({ Component }, i) => (
//         <TabPanel value={value} index={i} key={i}>
//           {Component}
//         </TabPanel>
//       ))}
//     </Box>
//   )
// }
