describe('Model favouriting', () => {

  let modelUuid = ''

  before(async() => 
  {
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
      updatedMetadata.buildOptions.uploadType = 'Model card only'
      cy.get('[data-test=metadataTextarea]')
        .clear()
        .type(JSON.stringify(metadata), { parseSpecialCharSequences: false, delay: 0 })
    })

    cy.log('Submitting model')
    cy.get('[data-test=warningCheckbox]').click()
    cy.get('[data-test=submitButton]').click()
    cy.url().should('contain', '/model/', { timeout: 10000 })

    // we need to wait for this somehow so we can use modelUuid through the tests...
    cy.url().then(url => {
      const match = url.match('/.*/model/(?<name>[^/]*)')
      modelUuid = match.groups.name
    })

  })

  it('Correctly displays a model card only view', () => {
    cy.log('Checking for model card alert message')
    cy.get('[data-test=modelCardPageAlert]').contains('This model version was uploaded as just a model card')
    cy.get('[data-test=metadataDisplay]').contains('Model card for Testing')

    cy.visit(`/model/${modelUuid}`)
  })
})