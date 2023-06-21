describe('Upload page', () => {
  beforeEach(() => {
    cy.visit('/upload')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Upload Model')
  })

  it('uploads zip file, but not on duplicate zip', () => {
    cy.get('[data-test=importModelTab]').click({ force: true })
    cy.get('[data-test=selectModel]').click()
    //model.cy.ts example
    cy.log('Selecting minimal_code.zip file')
    cy.get('input[type="file"]').selectFile('cypress/fixtures/minimal_code.zip', { force: true })
    cy.get('[data-test=warningCheckbox]').click()
    cy.get('[data-test=submitButton]').click()
    // add section that navigates to newly imported page: marketplace/model/overview model page
    // cy.url().should('include', '/minimal_code')

    cy.get('[data-test=selectModel]').click()
    cy.log('Selecting minimal_code.zip file')
    cy.get('input[type="file"]').selectFile('cypress/fixtures/minimal_code.zip', { force: true })
    // delete - cy.get('.PrivateSwitchBase-input').click()
    cy.get('[data-test=warningCheckbox]').click()
    cy.get('[data-test=submitButton]').click()
    cy.get('.MuiAlert-standardError')
  })

  // it('does not upload a json file, but error message disappears when a zip file is uploaded', () => {
  //   cy.get('[data-test=importModelTab]').click({ force: true })
  //   cy.get('[data-test=selectModel]').click()
  //   //model.cy.ts example
  //   cy.log('Selecting minimal_code.zip file')
  //   cy.get('input[type="file"]').selectFile('cypress/fixtures/minimal_metadata.json', { force: true })
  //   cy.get('.MuiAlert-standardError')
  //   cy.get('[data-test=selectModel]').click()
  //   cy.get('input[type="file"]').selectFile('cypress/fixtures/minimal_code.zip', { force: true })
  //   cy.get('.MuiAlert-standardError').should('not.exist')
  // })
})

export {}
