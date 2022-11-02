describe('Model with code and binary files', () => {
  it('Can upload, review and deploy a model', () => {
    // Navigate to Upload page
    cy.visit('/upload')

    // Navigate to json tab
    cy.get('[data-test=uploadJsonTab]').click({ force: true })

    // Select correct schema
    cy.get('[data-test=selectSchemaInput]').trigger('mousedown', { force: true, button: 0 })
    cy.fixture('schema_names.json').then((schemaNames) => {
      cy.get(`[role=option]:contains(${schemaNames.model})`).click()
    })

    // Add code and binary files
    cy.get('[for=select-code-file]').selectFile('cypress/fixtures/minimal_code.zip')
    cy.get('[for=select-binary-file]').selectFile('cypress/fixtures/minimal_binary.zip')

    // Input metadata
    cy.fixture('minimal_metadata.json').then((metadata) => {
      cy.get('[data-test=metadataTextarea]')
        .clear()
        .type(JSON.stringify(metadata), { parseSpecialCharSequences: false, delay: 0 })
    })

    // Click warning checkbox
    cy.get('[data-test=warningCheckbox]').click()

    // Submit upload
    cy.get('[data-test=submitButton]').click()

    // Check URL has been updated
    cy.url().should('contain', '/model/', { timeout: 10000 })

    // Navigate to Build Logs tab
    cy.get('[data-test=buildLogsTab]').click({ force: true })
  })
})

export {}
