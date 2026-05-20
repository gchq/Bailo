describe('Check that the documentation pages exist', () => {
  it('checks that the main docs are accessible', () => {
    cy.visit('/docs')
    cy.contains('What is Bailo?')
  })

  it('checks that the Open API docs are accessible for V2', () => {
    cy.visit('/api/docs')
    cy.contains('Bailo API')
    cy.request('/api/v2/api-docs/swagger.json')
      .its('body')
      .its('info')
      .should('include', { title: 'Bailo API', version: '2.0.0' })
  })

  it('checks that the Open API docs are accessible for V3', () => {
    cy.visit('/api/docs')
    cy.contains('Bailo API')
    cy.request('/api/v3/api-docs/swagger.json')
      .its('body')
      .its('info')
      .should('include', { title: 'Bailo API', version: '3.0.0-beta' })
  })

  it('checks that the Python docs are accessible', () => {
    cy.visit('/docs/python')
    cy.contains('Welcome to Bailo’s Python Client documentation!')
  })
})
