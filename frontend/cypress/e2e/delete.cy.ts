import convertNameToUrlFormat from '../utils/convertNameToUrlFormat'

let modelUrl = ''

describe('delete version', () => {
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
      cy.get('[data-test=metadataTextarea]').clear()
      cy.get('[data-test=metadataTextarea]').type(JSON.stringify(updatedMetadata), {
        parseSpecialCharSequences: false,
        delay: 0,
      })

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

  it('Can delete a model version and all corresponding data', () => {
    cy.visit(`${modelUrl}?tab=settings`)
    cy.get('[data-test=modelSettingsPage]').contains('Danger Zone')
    cy.log('Select delete version button')
    cy.get('[data-test=deleteVersionButton]').click()
    cy.log('Select confirm')
    cy.get('[data-test=confirmButton]').click()
    cy.visit(modelUrl)
    cy.get('body').contains('Unable to find model')
  })
})
