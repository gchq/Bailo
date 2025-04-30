describe('Check that the documentation pages exist', () => {
  it('checks that the main docs are accessible', () => {
    cy.visit('/docs')
    cy.contains('What is Bailo?')
  })

  it('checks that the Open API docs are accessible', () => {
    cy.visit('/docs/api')
    cy.contains('Bailo API')
    cy.request('/api/v2/specification').its('body').its('info').should('include', { title: 'Bailo API' })
  })

  it('checks that the Python docs are accessible', () => {
    cy.visit('/docs/python')
    cy.contains('Welcome to Bailo’s Python Client documentation!')
  })
})
