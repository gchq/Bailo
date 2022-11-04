const getUuidFromUrl = (url: string): string => url.slice(url.lastIndexOf('/') + 1)

let modelUuid = ''

describe('Model with code and binary files', () => {
  before(() => {
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
    cy.url({ timeout: 10000 })
      .as('modelUrl')
      .should('contain', '/model/')
      .then((url) => {
        modelUuid = getUuidFromUrl(url)
      })

    // Navigate to Build Logs tab
    cy.get('[data-test=buildLogsTab]').click({ force: true })

    // Wait for model to be built
    cy.get('[data-test=terminalLog] > :last-child', { timeout: 20000 }).should(
      'contain',
      'Successfully completed build'
    )
  })

  // uploading a model with code and binaries, review the model, wait for build, deploy model, test deployment
  it('Can review and deploy a model', function () {
    cy.log('Navigating to review page')
    cy.get('[data-test=reviewLink]').click()
    cy.url().should('contain', '/review')

    cy.log('Approving model')
    cy.get(`[data-test=approveButtonManager${modelUuid}]`).click({ force: true })
    cy.get('[data-test=confirmButton]').click()
    cy.get('[data-test=confirmButton]').should('not.exist')
    cy.get(`[data-test=approveButtonReviewer${modelUuid}]`).click({ force: true })
    cy.get('[data-test=confirmButton]').click()

    cy.log('Navigating to model page')
    cy.visit(this.modelUrl)
    cy.url().should('contain', '/model/')

    cy.log('Deploying model')
    cy.get('[data-test="modelActionsButton"]').click({ force: true })
    cy.get('[data-test=submitDeployment]').click()
    cy.url().should('contain', '/deploy')
    cy.get('[data-test=uploadJsonTab]').click({ force: true })
  })
})

export {}
