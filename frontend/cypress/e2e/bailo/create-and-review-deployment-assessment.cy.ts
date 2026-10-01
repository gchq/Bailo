export {}

const uniqueId = Date.now()
const modelName = `Deployment assessment model ${uniqueId}`
const publishedAssessmentName = `Published deployment assessment ${uniqueId}`
const draftAssessmentName = `Draft deployment assessment ${uniqueId}`
const deploymentAssessmentSchemaId = 'minimal-deployment-assessment-schema-v1'

let modelId = ''
let publishedAssessmentId = ''
let draftAssessmentId = ''

function deploymentAssessmentMetadata(modelIds: string[]) {
  return {
    modelOverview: { modelIds },
    signOff: { riskOwners: ['user:user'] },
    about: {
      deploymentSummary: 'Deployment assessment created by the end-to-end review test.',
      deploymentDate: new Date().toLocaleDateString('en-CA'),
    },
  }
}

describe('Create and review a deployment assessment', () => {
  before(() => {
    cy.request('POST', '/api/v2/models', {
      name: modelName,
      kind: 'model',
      description: 'A model used to test deployment assessment reviews.',
      visibility: 'public',
      state: 'Production',
      collaborators: [{ entity: 'user:user', roles: ['owner'] }],
    }).then((response) => {
      expect(response.status).to.eq(200)
      modelId = response.body.model.id

      cy.request('POST', '/api/v3/deployment-assessments', {
        name: publishedAssessmentName,
        schemaId: deploymentAssessmentSchemaId,
        metadata: deploymentAssessmentMetadata([modelId]),
        draft: false,
      }).then((publishedResponse) => {
        expect(publishedResponse.status).to.eq(201)
        publishedAssessmentId = publishedResponse.body.deploymentAssessment.id
      })

      cy.request('POST', '/api/v3/deployment-assessments', {
        name: draftAssessmentName,
        schemaId: deploymentAssessmentSchemaId,
        metadata: deploymentAssessmentMetadata([modelId]),
        draft: true,
      }).then((draftResponse) => {
        expect(draftResponse.status).to.eq(201)
        draftAssessmentId = draftResponse.body.deploymentAssessment.id
      })
    })
  })

  it('shows the review banner and moves the assessment when changes are requested', () => {
    cy.log('Checking the review banner on the model deployment assessments tab')
    cy.visit(`/model/${modelId}?tab=deployments`)
    cy.get(`[data-test=deploymentAssessmentSummary-${publishedAssessmentId}]`).within(() => {
      cy.contains('Ready for review')
      cy.get('[data-test=reviewButton]').should('be.visible')
    })

    cy.log('Checking the review banner and status chip on the deployment assessment page')
    cy.visit(`/deployment-assessments/${publishedAssessmentId}`)
    cy.get('[data-test=deploymentAssessmentContainer]').within(() => {
      cy.contains('Ready for review')
      cy.get('[data-test=reviewButton]').should('be.visible')
      cy.get('[data-test=deploymentAssessmentStateChip]').should('contain.text', 'Needs review')
    })

    cy.log('Checking the assessment is in the Needs Review column')
    cy.visit('/deployment-assessments?tab=needs-action')
    cy.get('[data-test=deploymentAssessmentColumn-needs_review]').within(() => {
      cy.contains(publishedAssessmentName)
    })

    cy.log('Requesting changes on the deployment assessment')
    cy.request({
      method: 'POST',
      url: `/api/v3/deployment-assessments/${publishedAssessmentId}/review`,
      body: {
        decision: 'request_changes',
        comment: 'Please address the issues identified in this assessment.',
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
    })

    cy.visit(`/deployment-assessments/${publishedAssessmentId}`)
    cy.get('[data-test=deploymentAssessmentStateChip]').should('contain.text', 'Changes requested')
    cy.contains('Ready for review').should('not.exist')
    cy.get('[data-test=reviewButton]').should('not.exist')

    cy.log('Checking the assessment moved to the Changes Requested column')
    cy.visit('/deployment-assessments?tab=needs-action')
    cy.get('[data-test=deploymentAssessmentColumn-changes_requested]').within(() => {
      cy.contains(publishedAssessmentName)
    })
    cy.get('[data-test=deploymentAssessmentColumn-needs_review]').within(() => {
      cy.contains(publishedAssessmentName).should('not.exist')
    })
  })

  it('does not allow a draft deployment assessment to be reviewed', () => {
    cy.visit(`/deployment-assessments/${draftAssessmentId}`)
    cy.get('[data-test=deploymentAssessmentContainer]').within(() => {
      cy.contains('This is a draft deployment assessment')
      cy.get('[data-test=deploymentAssessmentStateChip]').should('contain.text', 'Draft')
      cy.contains('Ready for review').should('not.exist')
      cy.get('[data-test=reviewButton]').should('not.exist')
    })

    cy.request({
      method: 'POST',
      url: `/api/v3/deployment-assessments/${draftAssessmentId}/review`,
      failOnStatusCode: false,
      body: { decision: 'approve', comment: '' },
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.error).to.have.property('message', 'Draft deployment assessments cannot be reviewed.')
    })
  })
})
