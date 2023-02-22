describe('Documentation page', () => {
  beforeEach(() => {
    cy.visit('/docs')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Documentation')
  })
})

export {}
