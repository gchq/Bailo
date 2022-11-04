import { v4 as uuidv4 } from 'uuid'

describe('Model favouriting', () => {
  const modelName = `Test model ${uuidv4()}`

  before(() => {
    cy.log('Navigate to Upload page and json tab')
    cy.visit('/upload')
    cy.get('[data-test=uploadJsonTab]').click({ force: true })

    cy.log('Selecting schema and inputting metadata')
    cy.get('[data-test=selectSchemaInput]').trigger('mousedown', { force: true, button: 0 })
    cy.fixture('schema_names.json').then((schemaNames) => {
      cy.get(`[role=option]:contains(${schemaNames.model})`).click()
    })
    cy.fixture('minimal_metadata.json').then((metadata) => {
      const updatedMetadata = { ...metadata }
      updatedMetadata.highLevelDetails.name = modelName
      updatedMetadata.buildOptions.uploadType = 'Model card only'
      cy.get('[data-test=metadataTextarea]')
        .clear()
        .type(JSON.stringify(metadata), { parseSpecialCharSequences: false, delay: 0 })
    })

    cy.log('Submitting model')
    cy.get('[data-test=warningCheckbox]').click()
    cy.get('[data-test=submitButton]').click()
    cy.url({ timeout: 10000 }).as('modelUrl').should('contain', '/model/')
  })

  it('Is able to favourite and unfavourite a model', function favouriteModelTest() {
    cy.visit(this.modelUrl)

    cy.log('Select favourite')
    cy.get('[data-test=modelActionsButton]').click({ force: true })
    cy.get('[data-test=favouriteModelButton]').click({ force: true })

    cy.visit('/')
    cy.get('[data-test=favouriteModelsTab]').click({ force: true })
    cy.get('[data-test=modelListBox]').contains(modelName)

    cy.visit(this.modelUrl)

    cy.log('Select unfavourite')
    cy.get('[data-test=modelActionsButton]').click({ force: true })
    cy.get('[data-test=unfavouriteModelButton]').click({ force: true })

    cy.visit('/')
    cy.get('[data-test=favouriteModelsTab]').click({ force: true })
    cy.get('[data-test=modelListBox]').contains(modelName).should('not.exist')
  })
})
