describe('Upload page', () => {
  beforeEach(() => {
    cy.visit('/upload')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Upload Model')
  })

  //Import Model tab cypress tests
  it('Renders Import Model, tests SELECT MODEL and tick box', () => {
    cy.get('[data-test=importModel]').click({ force: true })
    cy.get('[data-test=selectModel]').click()
    cy.get('.PrivateSwitchBase-input').click()
  })
})

export {}
