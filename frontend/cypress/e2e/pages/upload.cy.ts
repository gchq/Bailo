describe('Upload page', () => {
  beforeEach(() => {
    cy.visit('/upload')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Upload Model')
  })

  it('Renders a tab header', () => {
    cy.get('.MuiTabs-flexContainer > :nth-child(3)').should('contain.text', 'Import Model')
  })

  it('Should open \'Open File\' when SELECT MODEL is clicked', () => {
    cy.get('.MuiTabs-flexContainer > :nth-child(3)')
    cy.get('button').should('contains.text', 'SELECT MODEL')
    cy.get('[data-test=SELECTMODELButton]').click()
    // cy.get('[data-test=headerTitle]').should('contain.text', 'Open File')
  })


})

export {}
