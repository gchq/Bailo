const runId = Date.now().toString()
const assessmentNames = {
  draft: `Deployment Search ${runId} Draft`,
  needsReview: `Deployment Search ${runId} Review`,
  approved: `Deployment Search ${runId} Approved`,
}
const modelNames = {
  alpha: `Deployment Search ${runId} Model Alpha`,
  beta: `Deployment Search ${runId} Model Beta`,
}
const modelIds: string[] = []
const assessmentIds: string[] = []
const assessmentCreatedAt: string[] = []
const schemaName = 'Minimal Deployment Assessment Schema v1'
const deploymentAssessmentSchemaId = 'minimal-deployment-assessment-schema-v1'
const searchTerm = `Deployment Search ${runId}`
const riskOwner = 'user:user'
let createdDate = ''

function createModel(name: string) {
  return cy
    .request('POST', '/api/v2/models', {
      name,
      kind: 'model',
      description: 'A model created through the API to test deployment assessment search filters.',
      state: 'Production',
      visibility: 'public',
    })
    .then((response) => {
      expect(response.status).to.equal(200)
      expect(response.body.model.name).to.equal(name)
      modelIds.push(response.body.model.id)
      return response.body.model.id as string
    })
}

function createDeploymentAssessment(name: string, linkedModelIds: string[], draft: boolean) {
  return cy
    .request('POST', '/api/v3/deployment-assessments', {
      name,
      schemaId: deploymentAssessmentSchemaId,
      metadata: {
        modelOverview: { modelIds: linkedModelIds },
        signOff: { riskOwners: [riskOwner] },
        about: {
          deploymentSummary: 'A deployment created through the API to test search filters.',
          deploymentDate: new Date().toLocaleDateString('en-CA'),
        },
      },
      draft,
    })
    .then((response) => {
      expect(response.status).to.equal(201)
      expect(response.body.deploymentAssessment.name).to.equal(name)
      assessmentIds.push(response.body.deploymentAssessment.id)
      assessmentCreatedAt.push(response.body.deploymentAssessment.createdAt)
      return response.body.deploymentAssessment
    })
}

function assertOnlyAssessment(name: string) {
  cy.contains('1 assessment found')
  cy.get('[data-test=deploymentAssessmentSummaryCard]').should('have.length', 1).and('contain.text', name)
  Object.values(assessmentNames)
    .filter((assessmentName) => assessmentName !== name)
    .forEach((assessmentName) => cy.contains(assessmentName).should('not.exist'))
}

function resetFilters() {
  cy.get('[data-test=deploymentAssessmentResetFilters]').click()
  cy.location('search').should('equal', '?tab=all-assessments')
  cy.get('[data-test=deploymentAssessmentSearchFilter]').find('input').should('have.value', '')
  cy.get('[data-test=deploymentAssessmentStatusFilter]').should('not.contain.text', 'Draft')
  cy.get('[data-test=deploymentAssessmentModelFilter]').find('[data-testid=CancelIcon]').should('not.exist')
  cy.contains(/assessments? found/)

  cy.visit(`/deployment-assessments?tab=all-assessments&search=${encodeURIComponent(searchTerm)}`)
  cy.contains('3 assessments found')
  cy.get('[data-test=deploymentAssessmentSummaryCard]').should('have.length', 3)
  Object.values(assessmentNames).forEach((name) => cy.contains(name).should('be.visible'))
}

function selectFilterOption(selector: string, option: string) {
  cy.get(selector).click()
  cy.get('[role=option]').contains(option).click()
}

function selectEntity(selector: string) {
  cy.get(selector).find('input').type('user')
  cy.get('[role=option]').contains('user').click()
}

function enterDate(selector: string, date: Date) {
  const values = [
    [date.getUTCFullYear().toString(), 2],
    [(date.getUTCMonth() + 1).toString().padStart(2, '0'), 1],
    [date.getUTCDate().toString().padStart(2, '0'), 0],
  ] as const

  values.forEach(([value, index]) => {
    cy.get(selector).find('[role=spinbutton]').eq(index).click().type(`{selectall}${value}`)
  })
}

function openAdvancedFilters() {
  cy.contains('button', 'Advanced filters').then(($button) => {
    if ($button.attr('aria-expanded') !== 'true') {
      cy.wrap($button).click()
    }
  })
}

describe('Search deployment assessments', () => {
  before(() => {
    createModel(modelNames.alpha).then((alphaModelId) => {
      createModel(modelNames.beta).then((betaModelId) => {
        createDeploymentAssessment(assessmentNames.draft, [alphaModelId], true).then((draftAssessment) => {
          createdDate = draftAssessment.createdAt.slice(0, 10)
        })
        createDeploymentAssessment(assessmentNames.needsReview, [betaModelId], false)
        createDeploymentAssessment(assessmentNames.approved, [alphaModelId, betaModelId], false).then(
          (approvedAssessment) => {
            cy.request('POST', `/api/v3/deployment-assessments/${approvedAssessment.id}/review`, {
              decision: 'approve',
            })
              .its('status')
              .should('equal', 201)
          },
        )
      })
    })

    cy.request(`/api/v3/deployment-assessments?search=${encodeURIComponent(searchTerm)}`).then((response) => {
      expect(response.status).to.equal(200)

      const assessments = response.body.deploymentAssessments
      expect(assessments).to.have.length(3)
      expect(assessments).to.deep.include.members([
        {
          id: assessmentIds[0],
          schemaId: deploymentAssessmentSchemaId,
          name: assessmentNames.draft,
          owner: [riskOwner],
          models: [modelIds[0]],
          draft: true,
          createdBy: 'user',
          createdAt: assessmentCreatedAt[0],
        },
        {
          id: assessmentIds[1],
          schemaId: deploymentAssessmentSchemaId,
          name: assessmentNames.needsReview,
          owner: [riskOwner],
          models: [modelIds[1]],
          state: 'needs_review',
          draft: false,
          createdBy: 'user',
          createdAt: assessmentCreatedAt[1],
        },
        {
          id: assessmentIds[2],
          schemaId: deploymentAssessmentSchemaId,
          name: assessmentNames.approved,
          owner: [riskOwner],
          models: [modelIds[0], modelIds[1]],
          state: 'approved',
          draft: false,
          createdBy: 'user',
          createdAt: assessmentCreatedAt[2],
        },
      ])
    })
  })

  after(() => {
    assessmentIds.forEach((assessmentId) => {
      cy.request('DELETE', `/api/v3/deployment-assessments/${assessmentId}`).its('status').should('equal', 200)
    })
    modelIds.forEach((modelId) => {
      cy.request('DELETE', `/api/v2/model/${modelId}`).its('status').should('equal', 200)
    })
  })

  beforeEach(() => {
    cy.visit(`/deployment-assessments?tab=all-assessments&search=${encodeURIComponent(searchTerm)}`)
    cy.contains('3 assessments found')
  })

  it('filters assessments by name', () => {
    cy.get('[data-test=deploymentAssessmentSearchFilter]')
      .find('input')
      .clear()
      .type(assessmentNames.draft, { delay: 0 })
    assertOnlyAssessment(assessmentNames.draft)
  })

  it('filters assessments using all status, basic and advanced fields and resets filters', () => {
    ;[
      ['Draft', assessmentNames.draft],
      ['Needs review', assessmentNames.needsReview],
      ['Approved', assessmentNames.approved],
    ].forEach(([status, assessmentName]) => {
      selectFilterOption('[data-test=deploymentAssessmentStatusFilter]', status)
      assertOnlyAssessment(assessmentName)
      resetFilters()
    })

    selectFilterOption('[data-test=deploymentAssessmentModelFilter]', modelNames.alpha)
    cy.contains('2 assessments found')
    cy.contains(assessmentNames.draft).should('be.visible')
    cy.contains(assessmentNames.approved).should('be.visible')
    cy.contains(assessmentNames.needsReview).should('not.exist')
    resetFilters()

    selectEntity('[data-test=deploymentAssessmentRiskOwnerFilter]')
    cy.contains('3 assessments found')
    resetFilters()

    openAdvancedFilters()
    selectFilterOption('[data-test=deploymentAssessmentSchemaFilter]', schemaName)
    cy.contains('3 assessments found')
    resetFilters()

    openAdvancedFilters()
    selectEntity('[data-test=deploymentAssessmentCreatedByFilter]')
    cy.contains('3 assessments found')
    resetFilters()

    openAdvancedFilters()
    const creationDate = new Date(`${createdDate}T00:00:00.000Z`)
    const previousMonth = new Date(creationDate)
    previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1, 15)
    const nextMonth = new Date(creationDate)
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 15)
    enterDate('[data-test=createdAfterFilter]', previousMonth)
    enterDate('[data-test=createdBeforeFilter]', nextMonth)
    cy.contains('3 assessments found')
    resetFilters()

    openAdvancedFilters()
    enterDate('[data-test=createdAfterFilter]', nextMonth)
    cy.contains('0 assessments found')
    resetFilters()

    openAdvancedFilters()
    cy.intercept('GET', '/api/v3/deployment-assessments*').as('filterDeploymentAssessments')
    enterDate('[data-test=createdAfterFilter]', nextMonth)
    cy.wait('@filterDeploymentAssessments')
    enterDate('[data-test=createdBeforeFilter]', previousMonth)
    cy.contains('The end date must be on or after the start date.').should('be.visible')
    cy.contains('assessment found').should('not.exist')
    cy.get('@filterDeploymentAssessments.all').should('have.length', 1)
  })
})
