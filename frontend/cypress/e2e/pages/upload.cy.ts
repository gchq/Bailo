describe('Upload page', () => {
  beforeEach(() => {
    cy.visit('/upload')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Upload Model')
  })

  it('uploads zip file', () => {
    cy.get('[data-test=importModel]').click({ force: true })
    cy.get('[data-test=selectModel]').click()
    //model.cy.ts example
    cy.log('Selecting minimal_code.zip file')
    cy.get('input[type="file"]').selectFile('cypress/fixtures/minimal_code.zip', { force: true })
    cy.get('.PrivateSwitchBase-input').click()
    cy.get('[data-test=submitButton]').click()
  })

  it('does not upload a json file', () => {
    cy.get('[data-test=importModel]').click({ force: true })
    cy.get('[data-test=selectModel]').click()
    //model.cy.ts example
    cy.log('Selecting minimal_code.zip file')
    cy.get('input[type="file"]').selectFile('cypress/fixtures/minimal_metadata.json', { force: true })
    cy.get('.MuiAlert-standardError')
  })
})

export {}
