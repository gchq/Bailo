describe('Upload page', () => {
  beforeEach(() => {
    cy.visit('/upload')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Upload Model')
  })

  it('uploads zip file navigating to the model card page, but errors on duplicate zip uploads', () => {
    //initial model import
    cy.get('[data-test=importModelTab]').click({ force: true })
    cy.get('[data-test=selectModel]').click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/fullImportModel.zip', { force: true })
    cy.get('[data-test=warningCheckbox]').click()
    cy.get('[data-test=submitButton]').click()
    cy.url().should('include', '/minimal-model-for-testing-pjwi8a')
    cy.get('[data-test=modelName]').should('contain.text', 'Minimal Model for Testing')

    //importing initial model again
    cy.get('[data-test=fileUpload]').click()
    cy.get('[data-test=importModelTab]').click({ force: true })
    cy.get('[data-test=selectModel]').click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/fullImportModel.zip', { force: true })
    cy.get('[data-test=warningCheckbox]').click()
    cy.get('[data-test=submitButton]').click()
    cy.get('[data-test=submissionError]').should('contain.text', 'This model already has a version with the same name')
  })

  it('errors when uploading non zip file, but error message disappears when a zip file is then uploaded', () => {
    //selecting non zip file
    cy.get('[data-test=importModelTab]').click({ force: true })
    cy.get('[data-test=selectModel]').click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/minimal_metadata.json', { force: true })
    cy.get('[data-test=submissionError]').should('contain.text', 'Ensure you select a .zip file using Select Model')
    //selecting a zip file
    cy.get('[data-test=selectModel]').click()
    cy.get('input[type="file"]').selectFile('cypress/fixtures/fullImportModel.zip', { force: true })
    cy.get('[data-test=submissionError]').should('not.exist')
  })
})

export {}
