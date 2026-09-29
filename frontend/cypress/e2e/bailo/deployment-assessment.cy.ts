import getUuidFromUrl from '../../utils/getUuidFromUrl'

const schemaId = 'minimal-deployment-assessment-schema-v1'
const modelName = 'DATestModel'
const deploymentAssessmentName = 'TestDAName'
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
  before(() => {
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
    cy.visit('/deployment-assessments')
    cy.get('[data-test=actionButton]').click()
    cy.url().should('contain', '/deployment-assessments/new')
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click()
    cy.get('#deployment-assessment-name').type(deploymentAssessmentName)

    cy.get('#root_deploymentSummary').type('This is a deployment')
    cy.get('[data-test=dateSelectorInput]').type('30062099').wait(500)

    cy.get('[data-test=signOffButton]').click()
    cy.contains('Who is the risk owner attached to this deployment assessment?')
    cy.get('[data-test=entitySelector] input').type('user').wait(500)
    cy.get('[role=presentation] ul li:first').click({ force: true }).wait(500)

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName)
    cy.get('[role=presentation] ul li:first').click({ force: true }).wait(500)

    cy.get('[data-test=submitDeploymentAssessmentButton]').click()
    cy.get('[data-test=deploymentAssessmentContainer]')

    cy.url()
      .as('daUrl')
      .should('contain', `/deployment-assessments/`)
      .then((url) => {
        deploymentAssessmentId = getUuidFromUrl(url)
      })
    cy.url().should('contain', `deployment-assessments/${deploymentAssessmentId}`)
  })

  it('edit new deployment assessment', () => {
    cy.visit(`/deployment-assessments/${deploymentAssessmentId}`)
    cy.contains(deploymentAssessmentName)
    cy.get('[data-test=editFormButton]').click()
    cy.get('[data-test=editNameInput] input').clear().type(newDeploymentAssessmentValuesObject.name)

    cy.get('#root_deploymentSummary').clear().type(newDeploymentAssessmentValuesObject.metadata.about.deploymentSummary)
    cy.get('[data-test=dateSelectorInput]').type('01052098').wait(500)

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelector] .MuiChip-deleteIcon').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName)
    cy.get('[role=presentation] ul li:first').click({ force: true }).wait(500)

    cy.get('[data-test=signOffButton]').click()
    cy.get('[data-test=entitySelector] .MuiChip-deleteIcon').click()
    cy.get('[data-test=entitySelector] input').type('user')
    cy.get('[role=presentation] ul li:nth-child(2)').click({ force: true }).wait(500)

    cy.get('[data-test=saveEditFormButton]').click()
    cy.get('[data-test=aboutButton]').click()
    cy.contains(newDeploymentAssessmentValuesObject.metadata.about.deploymentSummary)
  })

  it('delete new deployment assessment', () => {
    cy.visit(`/deployment-assessments/${deploymentAssessmentId}`)
    cy.get('[data-test=deleteFormButton]').click()

    cy.get('[data-test=deleteInputVerification]').type(newDeploymentAssessmentValuesObject.name)
    cy.get('[data-test=deleteConfirmButton]').click()
    cy.location('pathname').should('eq', '/deployment-assessments')
  })

  it('Create a draft deployment assessment', () => {
    // Creates draft DA
    cy.visit('/deployment-assessments')
    cy.get('[data-test=actionButton]').click()
    cy.url().should('contain', '/deployment-assessments/new')
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click()
    cy.get('#deployment-assessment-name').type(deploymentAssessmentName)
    cy.get('[data-test=saveDraftButton]').click()
    cy.url()
      .as('daUrl')
      .should('contain', `/deployment-assessments/`)
      .then((url) => {
        draftDeploymentAssessmentId = getUuidFromUrl(url)
      })

    cy.url().should('contain', `deployment-assessments/${draftDeploymentAssessmentId}`)

    // Erroneously attempts to publish with unfinished
    cy.get('[data-test=draftBanner] [data-test=publishDraftButton]').click()
    cy.get('[data-test=confirmButton]').click()
    cy.contains('Bad Request')

    // Check draft banner still exists
    cy.get('[data-test=draftBanner]').should('exist')

    // Edit form and publish
    cy.press(Cypress.Keyboard.Keys.ESC)
    cy.get('[data-test=editFormButton]').click()

    cy.get('#root_deploymentSummary').type(newDeploymentAssessmentValuesObject.metadata.about.deploymentSummary)
    cy.get('[data-test=dateSelectorInput]').type('01052098').wait(500)

    cy.get('[data-test=signOffButton]').click().wait(500)
    cy.get('[data-test=entitySelector] input').type('user').wait(500)
    cy.get('[role=presentation] ul li:nth-child(2)').click({ force: true }).wait(500)

    cy.get('[data-test=modelOverviewButton]').click()
    cy.get('[data-test=modelSelectorInput]').type(modelName).wait(500)
    cy.get('[role=presentation] ul li:first').click({ force: true }).wait(500)

    cy.get('[data-test=saveEditFormButton]').click()

    cy.get('[data-test=draftBanner] [data-test=publishDraftButton]').click()
    cy.get('[data-test=confirmButton]').click()

    // Draft banner should no longer exist
    cy.contains('Needs review')
    cy.get('[data-test=draftBanner]').should('not.exist')
  })
})
