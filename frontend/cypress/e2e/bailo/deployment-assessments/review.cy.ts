export {}

const uniqueId = Date.now()
const modelName = `Deployment assessment model ${uniqueId}`
const publishedAssessmentName = `Published deployment assessment ${uniqueId}`
const draftAssessmentName = `Draft deployment assessment ${uniqueId}`
const commentHistoryAssessmentName = `Deployment assessment comment history ${uniqueId}`
const reviewHistoryAssessmentName = `Deployment assessment review history ${uniqueId}`
const deploymentAssessmentSchemaId = 'minimal-deployment-assessment-schema-v1'

let modelId = ''
let publishedAssessmentId = ''
let draftAssessmentId = ''
let commentHistoryAssessmentId = ''
let reviewHistoryAssessmentId = ''

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

      cy.request('POST', '/api/v3/deployment-assessments', {
        name: commentHistoryAssessmentName,
        schemaId: deploymentAssessmentSchemaId,
        metadata: deploymentAssessmentMetadata([modelId]),
        draft: false,
      }).then((commentHistoryResponse) => {
        expect(commentHistoryResponse.status).to.eq(201)
        commentHistoryAssessmentId = commentHistoryResponse.body.deploymentAssessment.id
      })

      cy.request('POST', '/api/v3/deployment-assessments', {
        name: reviewHistoryAssessmentName,
        schemaId: deploymentAssessmentSchemaId,
        metadata: deploymentAssessmentMetadata([modelId]),
        draft: false,
      }).then((reviewHistoryResponse) => {
        expect(reviewHistoryResponse.status).to.eq(201)
        reviewHistoryAssessmentId = reviewHistoryResponse.body.deploymentAssessment.id
      })
    })
  })

  after(() => {
    ;[publishedAssessmentId, draftAssessmentId, commentHistoryAssessmentId, reviewHistoryAssessmentId].forEach(
      (assessmentId) => {
        cy.request('DELETE', `/api/v3/deployment-assessments/${assessmentId}`).its('status').should('equal', 200)
      },
    )
    cy.request('DELETE', `/api/v2/model/${modelId}`).its('status').should('equal', 200)
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
      url: `/api/v3/deployment-assessments/${publishedAssessmentId}/reviews`,
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
      url: `/api/v3/deployment-assessments/${draftAssessmentId}/reviews`,
      failOnStatusCode: false,
      body: { decision: 'approve', comment: '' },
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.error).to.have.property('message', 'Draft deployment assessments cannot be reviewed.')
    })
  })

  it('comments can be made on deployment assessments', () => {
    const initialComment = `Initial history comment ${uniqueId}`

    cy.intercept('GET', `/api/v3/deployment-assessments/${commentHistoryAssessmentId}/comments`).as(
      'getHistoryComments',
    )
    cy.visit(`/deployment-assessments/${commentHistoryAssessmentId}`)
    cy.wait('@getHistoryComments').its('response.statusCode').should('equal', 200)

    cy.intercept('POST', `/api/v3/deployment-assessments/${commentHistoryAssessmentId}/comments`).as(
      'postHistoryComment',
    )
    cy.intercept('GET', `/api/v3/deployment-assessments/${commentHistoryAssessmentId}/comments`).as(
      'refreshHistoryComments',
    )
    cy.get('[data-test=richTextEditor]').type(initialComment)
    cy.contains('button', 'Add comment').click()
    cy.wait('@postHistoryComment').then(({ request, response }) => {
      expect(request.body).to.deep.equal({ comment: initialComment })
      expect(response?.statusCode).to.equal(201)
    })
    cy.wait('@refreshHistoryComments')
    cy.contains(initialComment).should('be.visible')
  })

  it('reviews can be made on deployment assessments, properly displaying the latest review decision', () => {
    const approvalComment = `Formal approval ${uniqueId}`
    const changesRequestedComment = `Later changes requested ${uniqueId}`

    cy.intercept('GET', `/api/v3/deployment-assessments/${reviewHistoryAssessmentId}/reviews`).as('getHistoryReviews')
    cy.visit(`/deployment-assessments/${reviewHistoryAssessmentId}`)
    cy.wait('@getHistoryReviews').its('response.statusCode').should('equal', 200)

    cy.intercept('POST', `/api/v3/deployment-assessments/${reviewHistoryAssessmentId}/reviews`).as('postHistoryReview')
    cy.intercept('GET', `/api/v3/deployment-assessments/${reviewHistoryAssessmentId}/reviews`).as(
      'refreshHistoryReviews',
    )
    cy.get('[data-test=reviewButton]').click()
    cy.get('[data-test=reviewWithCommentContent]').should('be.visible')
    cy.get('[data-test=reviewWithCommentContent] [data-test=richTextEditor]').type(approvalComment)
    cy.get('[data-test=approveReviewButton]').click()
    cy.get('[data-test=submitReviewButton]').click()
    cy.wait('@postHistoryReview').then(({ request, response }) => {
      expect(request.body).to.deep.equal({ decision: 'approve', comment: approvalComment })
      expect(response?.statusCode).to.equal(201)
    })
    cy.wait('@refreshHistoryReviews')
    cy.contains('has approved').should('be.visible')
    cy.contains(approvalComment).should('be.visible')
    cy.get('[data-test=deploymentAssessmentStateChip]').should('contain.text', 'Approved')

    cy.request('POST', `/api/v3/deployment-assessments/${reviewHistoryAssessmentId}/reviews`, {
      decision: 'request_changes',
      comment: changesRequestedComment,
    })
      .its('status')
      .should('equal', 201)

    cy.reload()
    cy.contains('Outdated').should('be.visible')
    cy.contains('has requested changes').should('be.visible')
    cy.contains(changesRequestedComment).should('be.visible')
    cy.get('[data-test=deploymentAssessmentStateChip]').should('contain.text', 'Changes requested')
  })
})
