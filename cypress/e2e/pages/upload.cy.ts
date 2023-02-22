describe('Upload page', () => {
  beforeEach(() => {
    cy.visit('/upload')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Upload Model')
  })
})

export {}
