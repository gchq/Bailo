import { readFileSync } from 'fs'
import Handlebars from 'handlebars'
import { outdent } from 'outdent'
import { resolve } from 'path'
import showdown from 'showdown'

import { CollaboratorEntry, ModelInterface } from '../models/Model.js'
import { ModelCardRevisionInterface } from '../models/ModelCardRevision.js'
import { ResponseInterface } from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import ReviewRoleModel from '../models/ReviewRole.js'
import { UserInterface } from '../models/User.js'
import { GetModelCardVersionOptionsKeys } from '../types/enums.js'
import { getModelById, getModelCard, getRoleEntities } from './model.js'
import { getSchemaById } from './schema.js'

const modelCardTemplate = Handlebars.compile(
  readFileSync(resolve(import.meta.dirname, 'templates', 'modelCardExport.hbs'), 'utf-8'),
)

type Common = {
  title: string
  description?: string
  widget?: string
}

type Fragment = (
  | {
      type: 'object'
      properties: {
        [x: string]: Fragment
      }
    }
  | {
      type: 'array'
      items: Fragment
    }
  | {
      type: 'string'
      maxLength: number
    }
  | {
      type: 'number'
    }
  | {
      type: 'boolean'
    }
) &
  Common

export type ReviewExport = {
  semver?: string
  collaborator: string
} & Pick<ResponseInterface, 'role' | 'decision' | 'comment' | 'updatedAt'>

export async function getModelCardHtml(
  user: UserInterface,
  modelId: ModelInterface['id'],
  version: number | GetModelCardVersionOptionsKeys,
) {
  const model = await getModelById(user, modelId)
  if (!model) {
    throw new Error('Failed to export model card. Model not found.')
  }

  const modelCard = await getModelCard(user, modelId, version)
  if (!modelCard) {
    throw new Error('Failed to find model card to export.')
  }

  const reviewExports = await createReleaseReviewExports(modelId)

  const modelCardRevision: ModelCardRevisionInterface = { ...modelCard, modelId, deleted: model.deleted }
  const html = await renderToHtml(model, modelCardRevision, reviewExports)

  return { html, modelCard }
}

export async function renderToMarkdown(
  model: ModelInterface,
  modelCardRevision: ModelCardRevisionInterface,
  reviewExports: ReviewExport[],
) {
  if (!model.card) {
    throw new Error('Trying to export model with no corresponding card')
  }

  const schema = await getSchemaById(modelCardRevision.schemaId)
  if (!schema) {
    throw new Error('Trying to export model with no corresponding card')
  }

  const reviewTable = renderMarkdownReviewTable(reviewExports)

  let output = outdent`
    # ${model.name}\n
    ${model.description}\n\n
    ## Model State\n
    ${model.state ? model.state : 'State Not Set'}\n\n
    ## Model Senior Responsible Officers\n
    ${getEntitiesWithRole('msro', model.collaborators)}\n\n
    ## Model Technical Reviewers\n
    ${getEntitiesWithRole('mtr', model.collaborators)}\n
    ${reviewTable}
  `
  const reviewRoles = await ReviewRoleModel.find({ reviewRoles: schema.reviewRoles })

  if (Array.isArray(reviewRoles)) {
    for (const reviewRole of reviewRoles) {
      output += `
      ## ${reviewRole.name}\n
      ${getEntitiesWithRole(reviewRole.shortName, model.collaborators)}\n\n
    `
    }
  } else {
    output += `## No reviewers assigned\n\n`
  }

  // 'Fragment' is a more strictly typed version of 'JsonSchema'.
  output = recursiveRender(modelCardRevision.metadata, schema.jsonSchema as Fragment, output)
  return output
}

function getEntitiesWithRole(role: string, collaborators: CollaboratorEntry[]) {
  return getRoleEntities([role], collaborators)[role].join('\n')
}

async function createReleaseReviewExports(modelId: string) {
  const reviews = await ReviewModel.aggregate([
    {
      $match: {
        modelId: modelId,
        kind: 'release',
      },
    },
    {
      $lookup: {
        from: 'v2_responses',
        localField: '_id',
        foreignField: 'parentId',
        as: 'response',
      },
    },
    {
      $unwind: '$response',
    },
  ])

  const reviewExports: ReviewExport[] = reviews.map((review) => ({
    semver: review.semver,
    collaborator: review.response.entity,
    role: review.response.role,
    decision: review.response.decision,
    comment: review.response.comment,
    updatedAt: review.response.updatedAt,
  }))

  return reviewExports
}

export async function renderToHtml(
  model: ModelInterface,
  modelCardRevision: ModelCardRevisionInterface,
  reviewExports: ReviewExport[],
) {
  const markdown = await renderToMarkdown(model, modelCardRevision, reviewExports)
  const converter = new showdown.Converter()
  converter.setFlavor('github')
  const body = converter.makeHtml(markdown)

  return modelCardTemplate({ body })
}

function renderMarkdownReviewTable(reviewExports: ReviewExport[]) {
  let reviewTable =
    '## Release Reviews\n\n' +
    '| Version | Collaborator | Role | Decision | Comment | Last Updated |\n' +
    '| :-----: | :----------: | :--: | :------: | :-----: | :----------: |\n'

  if (!reviewExports || reviewExports.length === 0) {
    return null
  }

  for (const reviewExport of reviewExports) {
    reviewTable =
      reviewTable +
      `|${reviewExport.semver}` +
      `|${reviewExport.collaborator}` +
      `|${reviewExport.role}` +
      `|${reviewExport.decision}` +
      // Linebreaks breaks the markdown-to-html conversion within a table
      `|${reviewExport.comment?.replace(/(\r\n|\n|\r)/gm, ' ')}` +
      `|${reviewExport.updatedAt}|\n`
  }

  return reviewTable
}

function recursiveRender(obj: any, schema: Fragment, output = '', depth = 1) {
  switch (schema.widget) {
    case 'tagSelector':
      if (obj === undefined || obj.length === 0) {
        output += outdent`\n\n
          ${'#'.repeat(depth)} ${schema.title}

          No entries
        `
        return output
      }

      output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj.map((item: string) => `- ${item}`).join('\n')}
        `

      return output
    default:
    // go to normal rendering
  }

  switch (schema.type) {
    case 'object':
      if (schema.title) {
        output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}
        `
      }

      for (const property in schema.properties) {
        // Render sub properties
        output = recursiveRender((obj || {})[property], schema.properties[property], output, depth + 1)
      }

      break
    case 'array': {
      if (schema.title) {
        output += outdent`\n\n
              ${'#'.repeat(depth)} ${schema.title}
          `
      }

      const count = 0
      if (obj === undefined || obj.length === 0) {
        output += outdent`\n\n
          No entries
        `
        break
      }

      for (const value of obj) {
        output += outdent`\n\n
          ${'#'.repeat(depth + 1)} Entry #${count + 1}
        `
        output = recursiveRender(value, schema.items, output, depth + 1)
      }
      break
    }
    case 'number':
      // We can add a description like this, but I felt it overkill:
      // ${schema.description ? `> ${schema.description}` : ''}

      if (!obj) {
        obj = 'No response'
      }

      output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj}
        `
      break
    case 'string':
      if (obj === undefined || obj === '') {
        obj = 'No response'
      }

      if (schema.title) {
        output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj}
        `
      } else {
        output += outdent`\n\n
            ${obj}
        `
      }
      break
    case 'boolean':
      if (obj === undefined) {
        obj = 'No response'
      } else {
        obj = obj ? 'Yes' : 'No'
      }

      if (schema.title) {
        output += outdent`\n\n
            ${'#'.repeat(depth)} ${schema.title}

            ${obj}
        `
      } else {
        output += outdent`\n\n
            ${obj}
        `
      }
      break
    default:
      throw new Error(
        `One of the types within this schema has not been implemented in the export method.  Received type ${(schema as any).type}`,
      )
  }

  return output
}
