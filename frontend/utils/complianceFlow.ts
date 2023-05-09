import { green, red, yellow } from '@mui/material/colors'
import { XYPosition } from 'reactflow'

import { Deployment, Version } from '../types/types'

function approvalColour(state: string) {
  if (state === 'No Response') return yellow['200']
  if (state === 'Accepted') return green['A200']
  if (state === 'Declined') return red['200']

  return yellow['200']
}

export default function createComplianceFlow(version: Version) {
  const position: XYPosition = { x: 0, y: 0 }

  const success = green['A200']
  const inProgress = yellow['200']

  let imageBuiltStyle: string = version.built ? success : inProgress
  if (version.state?.build?.state === 'failed') {
    imageBuiltStyle = red['200']
  }

  let managerApprovedStyle
  let reviewerApprovedStyle
  if (version.built) {
    managerApprovedStyle = approvalColour(version.managerApproved)
    reviewerApprovedStyle = approvalColour(version.reviewerApproved)
  }

  const availableStyle =
    version.built && version.managerApproved === 'Accepted' && version.reviewerApproved === 'Accepted'
      ? success
      : undefined

  return {
    nodes: [
      {
        id: 'upload',
        type: 'input',
        data: { label: 'Model Uploaded' },
        position,
        style: { background: success },
      },
      {
        id: 'metadata_validated',
        data: { label: 'Metadata Validated' },
        position,
        style: { background: success },
      },
      {
        id: 'image_built',
        data: { label: 'Image Built' },
        position,
        style: { background: imageBuiltStyle },
      },
      {
        id: 'manager_checks',
        data: { label: 'Checks by Manager' },
        position,
        style: { background: managerApprovedStyle },
      },
      {
        id: 'reviewer_checks',
        data: { label: 'Checks by Reviewer' },
        position,
        style: { background: reviewerApprovedStyle },
      },
      {
        id: 'model_available',
        type: 'output',
        data: { label: 'Model Available' },
        position,
        style: { background: availableStyle },
      },
    ],
    edges: [
      { id: '1', source: 'upload', target: 'metadata_validated', type: 'smoothstep' },
      { id: '999', source: 'metadata_validated', target: 'image_built', type: 'smoothstep' },
      { id: '2', source: 'image_built', target: 'manager_checks', type: 'smoothstep' },
      { id: '3', source: 'image_built', target: 'reviewer_checks', type: 'smoothstep' },
      { id: '4', source: 'manager_checks', target: 'model_available', type: 'smoothstep' },
      { id: '5', source: 'reviewer_checks', target: 'model_available', type: 'smoothstep' },
    ],
  }
}

export function createDeploymentComplianceFlow(deployment: Deployment) {
  const position: XYPosition = { x: 0, y: 0 }

  const success = green['A200']
  const inProgress = yellow['200']

  const imageBuiltStyle = deployment.built ? success : inProgress

  let managerApprovedStyle
  if (deployment.built) {
    managerApprovedStyle = approvalColour(deployment.managerApproved)
  }

  const availableStyle = deployment.managerApproved === 'Accepted' ? success : undefined

  return {
    nodes: [
      {
        id: 'deployment',
        type: 'input',
        data: { label: 'Deployment Created' },
        position,
        style: { background: success },
      },
      {
        id: 'metadata_validated',
        data: { label: 'Metadata Validated' },
        position,
        style: { background: success },
      },
      {
        id: 'deployment_built',
        data: { label: 'Deployment Built' },
        position,
        style: { background: imageBuiltStyle },
      },
      {
        id: 'manager_checks',
        data: { label: 'Checks by Manager' },
        position,
        style: { background: managerApprovedStyle },
      },
      {
        id: 'deployment_available',
        type: 'output',
        data: { label: 'Deployment Available' },
        position,
        style: { background: availableStyle },
      },
    ],
    edges: [
      { id: '1', source: 'deployment', target: 'metadata_validated', type: 'smoothstep' },
      { id: '999', source: 'metadata_validated', target: 'manager_checks', type: 'smoothstep' },
      { id: '2', source: 'manager_checks', target: 'deployment_built', type: 'smoothstep' },
      { id: '4', source: 'deployment_built', target: 'deployment_available', type: 'smoothstep' },
    ],
  }
}
