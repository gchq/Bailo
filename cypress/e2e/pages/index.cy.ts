describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Explore Models')
  })

  it('Should toggle dark mode when switch is toggled', () => {
    cy.get('[data-test=showUserMenu]').click()
    cy.get('[data-test=appBar]').should('have.css', 'background-color', 'rgb(39, 89, 142)')
    cy.get('[data-test=toggleDarkMode]').click()
    cy.get('[data-test=appBar]').should('have.css', 'background-color', 'rgb(36, 36, 36)')
    cy.get('[data-test=toggleDarkMode]').click()
    cy.get('[data-test=appBar]').should('have.css', 'background-color', 'rgb(39, 89, 142)')
  })
})

export {}
