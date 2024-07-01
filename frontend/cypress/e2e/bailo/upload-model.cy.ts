import getUuidFromUrl from '../../utils/getUuidFromUrl'

const newModelUrl = '/entry/new'

let modelUuid = ''
const schemaId = 'minimal-general-v10'

describe('Create new model', () => {
  it('loads the Create a new model Page', () => {
    cy.visit(newModelUrl)
    cy.get('[data-test=createModelButton]').click()
    cy.contains('Create Model')
  })

  it('creates a public new model', () => {
    cy.visit(newModelUrl)
    cy.get('[data-test=createModelButton]').click()

    cy.get('[data-test=entryNameInput]').type('test model', { force: true })
    cy.get('[data-test=entryDescriptionInput]').type('test description', { force: true })

    cy.get('[data-test=publicButtonSelector]').click()
    cy.get('[data-test=createEntryButton]').click()
    cy.get('[data-test=createEntryCardOverview]')

    cy.log('Checking URL has been updated')
    cy.url()
      .as('modelUrl')
      .should('contain', `/model/`)
      .then((url) => {
        modelUuid = getUuidFromUrl(url)
      })
  })

  it('creates a private new model', () => {
    cy.log('Navigating to the new model page')
    cy.visit(newModelUrl)
    cy.get('[data-test=createModelButton]').click()

    cy.log('Filling out the form to make a private model and submitting')
    cy.get('[data-test=entryNameInput]').type('test model', { force: true })
    cy.get('[data-test=entryDescriptionInput]').type('test description', { force: true })

    cy.get('[data-test=privateButtonSelector]').click()
    cy.get('[data-test=createEntryButton]').click()
    cy.get('[data-test=createEntryCardOverview]')
  })

  it('can set a schema for a newly created model', () => {
    cy.visit(`/model/${modelUuid}`)
    cy.contains('Create a model card')
    cy.get('[data-test=createSchemaFromScratchButton]').click()
    cy.log('Checking URL has been updated')
    cy.url().should('contain', `/model/${modelUuid}/schema`)
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click({
      multiple: true,
      force: true,
    })
    cy.url().should('not.contain', '/schema')
    cy.contains('Edit model card')
  })

  it('can edit an existing model', () => {
    cy.log('Navigating to an existing model')
    cy.visit(`/model/${modelUuid}`)
    cy.contains('Edit model card')
    cy.log('Test that we can edit the model card')
    cy.get('[data-test=editEntryCardButton]').click()
    cy.get('#root_modelSummary').type('This is a test summary')
    cy.get('[data-test=cancelEditEntryCardButton]').click({ force: true })
    cy.contains('This is a test summary').should('not.exist')
    cy.get('[data-test=editEntryCardButton]').click({ force: true })
    cy.get('#root_modelSummary').type('This is a test summary')
    cy.get('[data-test=saveEntryCardButton]').click({ force: true })
    cy.contains('This is a test summary')
  })
})
