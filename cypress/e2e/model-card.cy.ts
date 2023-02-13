import convertNameToUrlFormat from '../utils/convertNameToUrlFormat'

let modelUrl = ''

describe('Model with model card only', () => {
  before(() => {
    cy.log('Navigate to Upload page and json tab')
    cy.visit('/upload')
    cy.get('[data-test=uploadJsonTab]').click({ force: true })

    cy.log('Selecting schema and inputting metadata')
    cy.get('[data-test=selectSchemaInput]').trigger('mousedown', { force: true, button: 0 })
    cy.fixture('schema_names.json').then((schemaNames) => {
      cy.get(`[role=option]:contains(${schemaNames.model})`).click()
    })

    cy.fixture('minimal_metadata.json').then((modelMetadata) => {
      const updatedMetadata = { ...modelMetadata }
      updatedMetadata.buildOptions.uploadType = 'Model card only'
      cy.get('[data-test=metadataTextarea]')
        .clear()
        .type(JSON.stringify(updatedMetadata), { parseSpecialCharSequences: false, delay: 0 })

      cy.log('Submitting model')
      cy.get('[data-test=warningCheckbox]').click()
      cy.get('[data-test=submitButton]').click()
      cy.url({ timeout: 15000 })
        .should('contain', `/model/${convertNameToUrlFormat(updatedMetadata.highLevelDetails.name)}`)
        .then((url) => {
          modelUrl = url
        })
    })
  })

  it('Correctly displays a model card only view', () => {
    cy.visit(modelUrl)
    cy.log('Checking for model card alert message')
    cy.get('[data-test=modelCardPageAlert]').contains('This model version was uploaded as just a model card')
    cy.get('[data-test=metadataDisplay]').contains('Minimal Model for Testing')
  })

  it('Can edit an existing model version', () => {
    cy.visit(modelUrl)
    cy.log('Select edit version')
    cy.get('[data-test=modelActionsButton]').click({ force: true })
    cy.get('[data-test=editModelButton]').click({ force: true })

    cy.log('Inputting edited metadata')
    cy.get('[data-test=uploadJsonTab]', { timeout: 10000 }).click({ force: true })
    cy.fixture('minimal_metadata.json').then((metadata) => {
      const updatedMetadata = { ...metadata }
      updatedMetadata.highLevelDetails.modelOverview = 'This is an edit'
      updatedMetadata.buildOptions.uploadType = 'Model card only'
      cy.get('[data-test=metadataTextarea]')
        .clear()
        .type(JSON.stringify(updatedMetadata), { parseSpecialCharSequences: false, delay: 0 })

      cy.log('Submitting edited model')
      cy.get('[data-test=warningCheckbox]').click()
      cy.get('[data-test=submitButton]').click()
      cy.url().should('contain', `/model/${convertNameToUrlFormat(updatedMetadata.highLevelDetails.name)}`)
      cy.get('[data-test=metadataDisplay]').contains('This is an edit')
    })
  })

  it('Can upload a new version of an existing model version', () => {
    cy.visit(modelUrl)
    cy.log('Select new version')
    cy.get('[data-test=modelActionsButton]').click({ force: true })
    cy.get('[data-test=newVersionButton]').click({ force: true })

    cy.log('Inputting new version metadata')
    cy.get('[data-test=uploadJsonTab]', { timeout: 10000 }).click({ force: true })
    cy.fixture('minimal_metadata.json').then((metadata) => {
      const updatedMetadata = { ...metadata }
      updatedMetadata.highLevelDetails.modelCardVersion = 'v2'
      updatedMetadata.buildOptions.uploadType = 'Model card only'
      cy.get('[data-test=metadataTextarea]')
        .clear()
        .type(JSON.stringify(updatedMetadata), { parseSpecialCharSequences: false, delay: 0 })

      cy.log('Submitting new version')
      cy.get('[data-test=warningCheckbox]').click()
      cy.get('[data-test=submitButton]').click()
      cy.url().should('contain', `/model/${convertNameToUrlFormat(updatedMetadata.highLevelDetails.name)}`)
      cy.get('[data-test=metadataDisplay]').contains('v2')
      cy.get('[data-test=metadataDisplay]').contains('Minimal Model for Testing')
    })
  })
})

export {}
