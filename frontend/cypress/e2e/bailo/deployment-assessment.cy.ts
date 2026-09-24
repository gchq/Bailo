export {}
const schemaId = 'minimal-deployment-assessment-schema-v1'

const modelName = 'DATestModel'

let deploymentAssessmentId = ''
let draftDeploymentAssessmentId = ''

const newDeploymentAssessmentValuesObject = {
  name: 'newTestDAName',
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
  // Creates model to be attached to DA, sets state to Production
  before(() => {
    cy.log('Upload new model and set schema via API')
    cy.request('POST', 'http://localhost:8080/api/v2/models', {
      name: modelName,
      kind: 'model',
      description: 'This is a test',
      visibility: 'public',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.model).to.have.property('name', modelName)
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
          })
        })
      })
    })
  })

  it('create new deployment assessment', () => {
    cy.intercept('POST', '/api/v3/deployment-assessments').as('postDA')
    cy.visit('/deployment-assessments')
    cy.get('[data-test=actionButton]').click()
    cy.url().should('contain', '/deployment-assessments/new')
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click()
    cy.get('#deployment-assessment-name').type('TestDAName')

    cy.get('#root_deploymentSummary').type('This is a deployment')
    cy.get('[data-test=dateSelectorInput]').type('30062099').wait(500)

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName).wait(500)
    cy.get('[role=presentation] ul li:first').click()

    cy.get('[data-test=signOffButton]').click()
    cy.get('[data-test=entitySelector] input', { timeout: 20000 }).type('user').wait(500)
    cy.get('[role=presentation] ul li:first').click().wait(100)

    cy.get('[data-test=submitDeploymentAssessmentButton]').click()

    cy.wait('@postDA').then((intercept) => {
      cy.log(intercept.toString())
      deploymentAssessmentId = intercept.response?.body.deploymentAssessment.id
    })
    cy.url().should('contain', `deployment-assessments/${deploymentAssessmentId}`)
  })

  it('edit new deployment assessment', () => {
    cy.intercept('GET', `/api/v3/deployment-assessments/${deploymentAssessmentId}`).as('getDA')
    cy.intercept('PATCH', `/api/v3/deployment-assessments/${deploymentAssessmentId}`).as('patchDA')
    cy.visit(`/deployment-assessments/${deploymentAssessmentId}`)
    cy.wait('@getDA').wait(500)
    cy.get('[data-test=editFormButton]').click().wait(500)
    cy.get('[data-test=editNameInput] input').clear().type(newDeploymentAssessmentValuesObject.name)

    cy.get('#root_deploymentSummary').clear().type(newDeploymentAssessmentValuesObject.metadata.about.deploymentSummary)
    cy.get('[data-test=dateSelectorInput]').type('01052098').wait(500)

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelector] .MuiChip-deleteIcon').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName).wait(500)
    cy.get('[role=presentation] ul li:first').click()

    cy.get('[data-test=signOffButton]').click()
    cy.get('[data-test=entitySelector] .MuiChip-deleteIcon').click()
    cy.get('[data-test=entitySelector] input').type('user').wait(500)
    cy.get('[role=presentation] ul li:nth-child(2)').click().wait(100)

    cy.get('[data-test=saveEditFormButton]').click()
    cy.wait('@patchDA').then((intercept) => {
      expect(intercept.response?.statusCode).to.eq(200)
      expect(intercept.response?.body.deploymentAssessment.name).to.eq(newDeploymentAssessmentValuesObject.name)
      expect(intercept.response?.body.deploymentAssessment.metadata).to.deep.equal(
        newDeploymentAssessmentValuesObject.metadata,
      )
    })
  })

  it('delete new deployment assessment', () => {
    cy.intercept('DELETE', `/api/v3/deployment-assessments/${deploymentAssessmentId}`).as('deleteDA')
    cy.visit(`/deployment-assessments/${deploymentAssessmentId}`)
    cy.get('[data-test=deleteFormButton]').click()

    cy.get('[data-test=deleteInputVerification]').type(newDeploymentAssessmentValuesObject.name)
    cy.get('[data-test=deleteConfirmButton]').click()

    cy.wait('@deleteDA').then((intercept) => {
      expect(intercept.response?.statusCode).to.eq(200)
      expect(intercept.response?.body.message).to.equal('Successfully removed deployment assessment.')
    })
    cy.location('pathname').should('eq', '/deployment-assessments')
  })

  it('Create a draft deployment assessment', () => {
    cy.intercept('POST', '/api/v3/deployment-assessments').as('postDA')
    cy.intercept('PATCH', `/api/v3/deployment-assessments/*`).as('patchDraftDA')

    // Creates draft DA
    cy.visit('/deployment-assessments')
    cy.get('[data-test=actionButton]').click()
    cy.url().should('contain', '/deployment-assessments/new')
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click()
    cy.get('#deployment-assessment-name').type('TestDAName')
    cy.get('[data-test=saveDraftButton]').click()
    cy.wait('@postDA').then((intercept) => {
      expect(intercept.response?.statusCode).to.eq(201)
      draftDeploymentAssessmentId = intercept.response?.body.deploymentAssessment.id
      expect(intercept.response?.body.deploymentAssessment.draft).to.eq(true)
    })

    cy.url().should('contain', `deployment-assessments/${draftDeploymentAssessmentId}`)

    // Erroneously attempts to publish with unfinished
    cy.get('[data-test=draftBanner] [data-test=publishDraftButton]').click()
    cy.get('[data-test=confirmButton]').click()
    cy.wait('@patchDraftDA').then((intercept) => {
      expect(intercept.response?.statusCode).to.eq(400)
    })

    // Check draft banner still exists
    cy.get('[data-test=draftBanner]').should('exist')

    // Edit form and publish
    cy.press(Cypress.Keyboard.Keys.ESC)
    cy.get('[data-test=editFormButton]').click()

    cy.get('#root_deploymentSummary').type(newDeploymentAssessmentValuesObject.metadata.about.deploymentSummary)
    cy.get('[data-test=dateSelectorInput]').type('01052098').wait(500)

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName).wait(500)
    cy.get('[role=presentation] ul li:first').click()

    cy.get('[data-test=signOffButton]').click()
    cy.get('[data-test=entitySelector] input').type('user').wait(500)
    cy.get('[role=presentation] ul li:nth-child(2)').click().wait(100)

    cy.get('[data-test=saveEditFormButton]').click()
    cy.wait('@patchDraftDA').then((intercept) => {
      expect(intercept.response?.statusCode).to.eq(200)
      expect(intercept.response?.body.deploymentAssessment.name).to.eq('TestDAName')
      expect(intercept.response?.body.deploymentAssessment.metadata).to.deep.equal(
        newDeploymentAssessmentValuesObject.metadata,
      )
    })

    cy.get('[data-test=draftBanner] [data-test=publishDraftButton]').click()
    cy.get('[data-test=confirmButton]').click()
    cy.wait('@patchDraftDA').then((intercept) => {
      expect(intercept.response?.statusCode).to.eq(200)
      expect(intercept.response?.body.deploymentAssessment.draft).to.eq(false)
    })

    // Draft banner should no longer exist
    cy.get('[data-test=draftBanner]').should('not.exist')
  })
})
