import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Edge, Node } from 'reactflow'
import { Version } from 'types/types'
import createComplianceFlow from 'utils/complianceFlow'

const ComplianceFlow = dynamic(() => import('../ComplianceFlow'))

interface Props {
  version: Version
}

export default function Compliance({ version }: Props) {
  const [complianceFlow, setComplianceFlow] = useState<{ edges: Edge[]; nodes: Node[] }>({ edges: [], nodes: [] })

  useEffect(() => {
    if (version) {
      setComplianceFlow(createComplianceFlow(version))
    }
  }, [version, setComplianceFlow])

  return <ComplianceFlow initialEdges={complianceFlow.edges} initialNodes={complianceFlow.nodes} />
}
