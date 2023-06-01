describe('Upload page', () => {
  beforeEach(() => {
    cy.visit('/upload')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Upload Model')
  })

  //Import Model tab cypress tests
  it('Renders a tab header', () => {
    cy.get('[data-test=importModel]').should('contain.text', 'Import Model')
  })

  it('Should open Import Model tab and allow you to click on SELECT MODEL', () => {
    cy.get('[data-test=importModel]').click({ force: true })
    cy.get('label > .MuiButtonBase-root').should('contain.text', 'Select Model').click()
  })

  it('Should change symbol and colour when the tick box is ticked', () => {
    cy.get('[data-test=importModel]').click({ force: true })
    cy.get('.PrivateSwitchBase-input').click()
  })
})

export {}
