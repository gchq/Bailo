import { Chip, Stack } from '@mui/material'
import { green, red, yellow } from '@mui/material/colors'
import dagre from 'dagre'
import ReactFlow, { ConnectionLineType, Edge, Node, Panel, Position } from 'reactflow'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 172
const nodeHeight = 36

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    /* eslint-disable no-param-reassign */
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = (isHorizontal ? 'left' : 'top') as Position
    node.sourcePosition = (isHorizontal ? 'right' : 'bottom') as Position

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    }

    return node
    /* eslint-enable no-param-reassign */
  })

  return { nodes, edges }
}

function ComplianceFlow({ initialEdges, initialNodes }: any) {
  const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges)

  return (
    <div className='layoutflow' style={{ width: '100%', height: '70vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        nodesConnectable={false}
        nodesDraggable={false}
        zoomOnScroll={false}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{
          maxZoom: 1.5,
        }}
        // Bailo is open source / non-commercial, so will disable attribution:
        // https://reactflow.dev/docs/guides/remove-attribution/
        proOptions={{ hideAttribution: true }}
      >
        <Panel position='top-right'>
          <Stack direction={'column'} spacing={0.5}>
            <Chip label='Success' sx={{ backgroundColor: green['A200'], border: '1px solid' }} />
            <Chip label='In Progress' sx={{ backgroundColor: yellow['200'], border: '1px solid' }} />
            <Chip label='Failed' sx={{ backgroundColor: red['200'], border: '1px solid' }} />
            <Chip label='Not Started' sx={{ border: '1px solid' }} />
          </Stack>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default ComplianceFlow
