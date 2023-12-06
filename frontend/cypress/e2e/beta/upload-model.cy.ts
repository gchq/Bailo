import getUuidFromUrl from '../../utils/getUuidFromUrl'

const newModelUrl = '/beta/model/new'

let modelUuid = ''
const schemaId = 'minimal-general-v10-beta'

describe('Beta create new model', () => {
  it('loads the Create a new model Page', () => {
    cy.visit(newModelUrl)
    cy.get('body').contains('Upload a new Model')
  })

  it('creates a public new model', () => {
    cy.visit(newModelUrl)

    cy.get('[data-test=modelNameInput]').type('test model')
    cy.get('[data-test=modelDescriptionInput]').type('test description')

    cy.get('[data-test=publicButtonSelector]').click()
    cy.get('[data-test=createModelButton]', { timeout: 15000 }).click()
    cy.get('[data-test=createModelCardOverview]')

    cy.log('Checking URL has been updated')
    cy.url({ timeout: 15000 })
      .as('modelUrl')
      .should('contain', `/model/`)
      .then((url) => {
        modelUuid = getUuidFromUrl(url)
      })
  })

  it('creates a private new model', () => {
    cy.visit(newModelUrl)

    cy.get('[data-test=modelNameInput]').type('test model')
    cy.get('[data-test=modelDescriptionInput]').type('test description')

    cy.get('[data-test=privateButtonSelector]').click()
    cy.get('[data-test=createModelButton]', { timeout: 15000 }).click()
    cy.get('[data-test=createModelCardOverview]')
  })

  it('can set a schema for a newly created model', () => {
    cy.visit(`/beta/model/${modelUuid}`)
    cy.get('body').contains('Create a model card')
    cy.get('[data-test=createSchemaFromScratchButton]', { timeout: 15000 }).click()
    cy.log('Checking URL has been updated')
    cy.url({ timeout: 15000 }).should('contain', `/beta/model/${modelUuid}/schema`)
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`, { timeout: 15000 }).click({
      multiple: true,
      force: true,
    })
    cy.get('body').contains('Edit Model card')
  })

  it('can edit an existing model', () => {
    cy.visit(`/beta/model/${modelUuid}`)
    cy.get('body').contains('Edit Model card')
    cy.get('[data-test=editModelButton]').click()
    cy.get('#root_modelSummary').type('This is a test summary')
    cy.get('[data-test=cancelEditButton]').click()
    cy.get('body').contains('This is a test summary').should('not.exist')
    cy.get('[data-test=editModelButton]').click()
    cy.get('#root_modelSummary').type('This is a test summary')
    cy.get('[data-test=saveModelCardButton]').click()
    cy.get('body').contains('This is a test summary')
  })
})
