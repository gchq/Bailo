export {}

const schemaId = 'minimal-deployment-assessment-schema-v1'
const runId = Date.now().toString()
const modelName = `DATestModel ${runId}`
const deploymentAssessmentName = `TestDAName ${runId}`
const editDeploymentAssessmentName = `EditDAName ${runId}`
const newDeploymentAssessmentName = `newTestDAName ${runId}`
let deploymentAssessmentId = ''
let editDeploymentAssessmentId = ''
let draftDeploymentAssessmentId = ''
let daToDeleteUuid = ''
const deploymentAssessmentIds: string[] = []
let modelId = ''

function enterDate(selector: string, date: Date) {
  const values = [
    [date.getUTCDate().toString().padStart(2, '0'), 0],
    [(date.getUTCMonth() + 1).toString().padStart(2, '0'), 1],
    [date.getUTCFullYear().toString(), 2],
  ] as const

  values.forEach(([value, index]) => {
    cy.get(selector).find('[role=spinbutton]').eq(index).click().type(`{selectall}${value}`).should('have.text', value)
  })

  cy.get(selector).find('[role=spinbutton]').eq(2)
  values.forEach(([value, index]) => {
    cy.get(selector).find('[role=spinbutton]').eq(index).should('have.text', value)
  })
}

const newDeploymentAssessmentValuesObject = {
  name: newDeploymentAssessmentName,
  metadata: {
    modelOverview: {
      modelIds: [] as string[],
    },
    signOff: { riskOwners: ['user:user2'] },
    about: {
      deploymentSummary: 'This is still a deployment',
      deploymentDate: '2098-05-01',
    },
  },
}

describe('Deployment Assessment Suite', () => {
  before(() => {
    cy.request('POST', 'http://localhost:8080/api/v2/models', {
      name: modelName,
      kind: 'model',
      description: 'This is a test',
      visibility: 'public',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.model).to.have.property('name', modelName)
      modelId = response.body.model.id
      newDeploymentAssessmentValuesObject.metadata.modelOverview.modelIds = [response.body.model.id]
      cy.request(
        'POST',
        `/api/v2/model/${newDeploymentAssessmentValuesObject.metadata.modelOverview.modelIds[0]}/setup/from-schema`,
        {
          schemaId: 'minimal-general-v10',
        },
      ).then((response) => {
        expect(response.status).to.eq(200)
        cy.request(
          'put',
          `api/v2/model/${newDeploymentAssessmentValuesObject.metadata.modelOverview.modelIds[0]}/model-cards`,
          {
            metadata: {
              overview: {
                modelSummary: 'Description of model',
              },
              anotherPage: {
                sectionOne: {
                  q3: '2099-06-30',
                },
              },
            },
          },
        ).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.card).to.have.property(
            'modelId',
            newDeploymentAssessmentValuesObject.metadata.modelOverview.modelIds[0],
          )
          cy.request(
            'patch',
            `/api/v2/model/${newDeploymentAssessmentValuesObject.metadata.modelOverview.modelIds[0]}`,
            {
              collaborators: [{ entity: 'user:user', roles: ['owner'] }],
              state: 'Production',
            },
          ).then((response) => {
            expect(response.status).to.eq(200)
            cy.request('POST', '/api/v3/deployment-assessments', {
              name: editDeploymentAssessmentName,
              schemaId,
              metadata: {
                about: {
                  deploymentSummary: 'This is a deployment to edit',
                  deploymentDate: '2099-06-30',
                },
                signOff: { riskOwners: ['user:user'] },
                modelOverview: { modelIds: [modelId] },
              },
              draft: false,
            }).then((assessmentResponse) => {
              expect(assessmentResponse.status).to.eq(201)
              editDeploymentAssessmentId = assessmentResponse.body.deploymentAssessment.id
              deploymentAssessmentIds.push(editDeploymentAssessmentId)
            })
          })
        })
      })
    })
  })

  after(() => {
    deploymentAssessmentIds.forEach((assessmentId) => {
      cy.request('DELETE', `/api/v3/deployment-assessments/${assessmentId}`).its('status').should('equal', 200)
    })
    if (modelId) {
      cy.request('DELETE', `/api/v2/model/${modelId}`).its('status').should('equal', 200)
    }
  })

  it('create new deployment assessment', () => {
    cy.visit('/deployment-assessments')
    cy.get('[data-test=actionButton]').click()
    cy.url().should('contain', '/deployment-assessments/new')
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click()
    cy.get('#deployment-assessment-name').type(deploymentAssessmentName)

    cy.get('#root_deploymentSummary').type('This is a deployment')
    enterDate('[data-test=dateSelectorInput]', new Date('2099-06-30T00:00:00.000Z'))

    cy.get('[data-test=signOffButton]').click()
    cy.contains('Who is the risk owner attached to this deployment assessment?')
    cy.get('[data-test=entitySelector] input').type('user')
    cy.get('[role=option]')
      .contains(/^user$/)
      .should('be.visible')
      .click()
    cy.get('[data-test=entitySelector] .MuiChip-root').should('have.length', 1)

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName)
    cy.get('[role=option]').contains(modelName).should('be.visible').click()
    cy.get('[data-test=modelSelector] .MuiChip-root').should('contain.text', modelName)

    cy.intercept('POST', '**/api/v3/deployment-assessments').as('submitDeploymentAssessment')
    cy.get('[data-test=submitDeploymentAssessmentButton]').should('be.enabled').click()
    cy.contains('Please make sure that all sections have been completed.').should('not.exist')
    cy.wait('@submitDeploymentAssessment').then(({ response }) => {
      expect(response?.statusCode).to.equal(201)
      deploymentAssessmentId = response?.body.deploymentAssessment.id
      deploymentAssessmentIds.push(deploymentAssessmentId)
    })
    cy.get('[data-test=deploymentAssessmentContainer]')

    cy.url().should('contain', '/deployment-assessments/').and('not.contain', '/deployment-assessments/new')
  })

  it('edit new deployment assessment', () => {
    cy.visit(`/deployment-assessments/${editDeploymentAssessmentId}`)
    cy.contains(editDeploymentAssessmentName)
    cy.get('[data-test=editFormButton]').click()
    cy.get('[data-test=editNameInput] input').clear().type(newDeploymentAssessmentValuesObject.name)

    cy.get('#root_deploymentSummary').clear().type(newDeploymentAssessmentValuesObject.metadata.about.deploymentSummary)
    enterDate('[data-test=dateSelectorInput]', new Date('2098-05-01T00:00:00.000Z'))

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelector] .MuiChip-deleteIcon').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName)
    cy.get('[role=option]').contains(modelName).should('be.visible').click()
    cy.get('[data-test=modelSelector] .MuiChip-root').should('contain.text', modelName)

    cy.get('[data-test=signOffButton]').click()
    cy.get('[data-test=entitySelector] .MuiChip-deleteIcon').click()
    cy.get('[data-test=entitySelector] input').type('user')
    cy.get('[role=option]')
      .contains(/^user2$/)
      .should('be.visible')
      .click()
    cy.get('[data-test=entitySelector] .MuiChip-root').should('have.length', 1)

    cy.intercept('PATCH', '**/api/v3/deployment-assessments/*').as('saveDeploymentAssessment')
    cy.get('[data-test=saveEditFormButton]').should('be.enabled').click()
    cy.wait('@saveDeploymentAssessment').its('response.statusCode').should('equal', 200)
    cy.contains(newDeploymentAssessmentName)
    cy.get('[data-test=aboutButton]').click()
    cy.contains(newDeploymentAssessmentValuesObject.metadata.about.deploymentSummary)
    // In the UI the date is formatted to DD/MM/YYYY
    cy.contains('01-05-2098')
    cy.get('[data-test=signOffButton]').click()
    cy.contains('Joe Bloggs')
  })

  it('delete new draft deployment assessment', () => {
    cy.request('POST', '/api/v3/deployment-assessments', {
      name: 'DA - Delete Me',
      schemaId: 'minimal-deployment-assessment-schema-v1',
      metadata: {},
      draft: true,
    }).then((response) => {
      expect(response.status).to.eq(201)
      daToDeleteUuid = response.body.deploymentAssessment.id
      cy.visit(`/deployment-assessments/${daToDeleteUuid}`)
      cy.get('[data-test=deleteFormButton]').click()

      cy.get('[data-test=deleteInputVerification]').type('DA - Delete Me')
      cy.get('[data-test=deleteConfirmButton]').click()
      cy.location('pathname').should('eq', '/deployment-assessments')
      cy.contains('Deployment assessment deleted')
      cy.visit(`/deployment-assessments/${daToDeleteUuid}`)
      cy.contains('The requested deployment assessment was not found.')
    })
  })

  it('Create a draft deployment assessment', () => {
    cy.visit('/deployment-assessments')
    cy.get('[data-test=actionButton]').click()
    cy.url().should('contain', '/deployment-assessments/new')
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click()
    cy.get('#deployment-assessment-name').type(deploymentAssessmentName)
    cy.intercept('POST', '**/api/v3/deployment-assessments').as('saveDraftDeploymentAssessment')
    cy.get('[data-test=saveDraftButton]').click()
    cy.wait('@saveDraftDeploymentAssessment').then(({ response }) => {
      expect(response?.statusCode).to.equal(201)
      draftDeploymentAssessmentId = response?.body.deploymentAssessment.id
      deploymentAssessmentIds.push(draftDeploymentAssessmentId)
    })

    cy.url().should('contain', '/deployment-assessments/').and('not.contain', '/deployment-assessments/new')

    cy.get('[data-test=editFormButton]').click()

    cy.get('#root_deploymentSummary').type(newDeploymentAssessmentValuesObject.metadata.about.deploymentSummary)
    enterDate('[data-test=dateSelectorInput]', new Date('2098-05-01T00:00:00.000Z'))

    cy.get('[data-test=signOffButton]').click()
    cy.contains('Who is the risk owner attached to this deployment assessment?').should('be.visible')
    cy.get('[data-test=entitySelector] input').type('user')
    cy.get('[role=option]')
      .contains(/^user2$/)
      .should('be.visible')
      .click()
    cy.get('[data-test=entitySelector] .MuiChip-root').should('have.length', 1)

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName)
    cy.get('[role=option]').contains(modelName).should('be.visible').click()
    cy.get('[data-test=modelSelector] .MuiChip-root').should('contain.text', modelName)

    cy.intercept('PATCH', '**/api/v3/deployment-assessments/*').as('saveDraftDeploymentAssessment')
    cy.get('[data-test=saveEditFormButton]').should('be.enabled').click()
    cy.wait('@saveDraftDeploymentAssessment').its('response.statusCode').should('equal', 200)
    cy.get('[data-test=editFormButton]').should('be.visible')
    cy.get('[data-test=draftBanner] [data-test=publishDraftButton]').should('be.enabled').click()
    cy.contains('Please make sure that all required fields are appropriately filled out before publishing.').should(
      'not.exist',
    )
    cy.get('[data-test=confirmButton]').should('be.visible').click()

    cy.contains('Needs review')
    cy.get('[data-test=draftBanner]').should('not.exist')
  })
})
