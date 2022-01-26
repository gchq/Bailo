import React, { useState } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  removeElements,
  Controls,
  isNode,
  Elements,
  Connection,
  Edge,
  NodeExtent,
  Position,
} from 'react-flow-renderer'
import dagre from 'dagre'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeExtent: NodeExtent = [
  [0, 0],
  [1000, 1000],
]

const ComplianceFlow = ({ initialElements }: { initialElements: Elements }) => {
  const [elements, setElements] = useState<Elements>(initialElements)
  const onConnect = (params: Connection | Edge) => setElements((els) => addEdge(params, els))
  const onElementsRemove = (elementsToRemove: Elements) => setElements((els) => removeElements(elementsToRemove, els))

  const onLayout = (reactFlowInstance: any, direction: string) => {
    const isHorizontal = direction === 'LR'
    dagreGraph.setGraph({ rankdir: direction })

    elements.forEach((el) => {
      if (isNode(el)) {
        dagreGraph.setNode(el.id, { width: 150, height: 50 })
      } else {
        dagreGraph.setEdge(el.source, el.target)
      }
    })

    dagre.layout(dagreGraph)

    const layoutedElements = elements.map((el) => {
      if (isNode(el)) {
        const nodeWithPosition = dagreGraph.node(el.id)
        el.targetPosition = isHorizontal ? Position.Left : Position.Top
        el.sourcePosition = isHorizontal ? Position.Right : Position.Bottom
        // we need to pass a slightly different position in order to notify react flow about the change
        // @TODO how can we change the position handling so that we dont need this hack?
        el.position = { x: nodeWithPosition.x + Math.random() / 1000, y: nodeWithPosition.y }
      }

      return el
    })

    setElements(layoutedElements)

    setInterval(() => reactFlowInstance.fitView({ padding: 0.2 }), 1)
  }

  return (
    <div className='layoutflow' style={{ width: '100%', height: '70vh' }}>
      <ReactFlowProvider>
        <ReactFlow
          elementsSelectable={false}
          nodesConnectable={false}
          nodesDraggable={false}
          elements={elements}
          onConnect={onConnect}
          onElementsRemove={onElementsRemove}
          nodeExtent={nodeExtent}
          onLoad={(reactFlowInstance: any) => onLayout(reactFlowInstance, 'TB')}
        >
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

export default ComplianceFlow
