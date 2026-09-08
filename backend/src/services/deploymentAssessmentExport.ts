import { outdent } from 'outdent'
import showdown from 'showdown'

import { UserInterface } from '../models/User.js'
import { getDeploymentAssessmentById } from './deploymentAssessment.js'
import { Fragment, htmlTemplate, recursiveRender } from './export.js'
import { getSchemaById } from './schema.js'

export async function getDeploymentAssessmentHtml(user: UserInterface, deploymentAssessmentId: string) {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId)
  const schema = await getSchemaById(deploymentAssessment.schemaId)

  let output = outdent`
      # ${deploymentAssessment.name}\n
    `
  output = recursiveRender(deploymentAssessment.metadata, schema.jsonSchema as Fragment, output)
  const converter = new showdown.Converter()
  converter.setFlavor('github')
  const body = converter.makeHtml(output)

  return { html: htmlTemplate({ body }), deploymentAssessment }
}
