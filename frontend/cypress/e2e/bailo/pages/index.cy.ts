describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Explore Models')
  })
})

export {}
