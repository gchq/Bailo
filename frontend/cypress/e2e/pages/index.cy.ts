describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Renders a heading', () => {
    cy.get('[data-test=headerTitle]').should('contain.text', 'Explore Models')
  })

  it('Should toggle dark mode when switch is toggled', () => {
    cy.get('[data-test=userMenuButton]').click()
    cy.get('[data-test=appBar]').should(
      'have.css',
      'background',
      'rgba(0, 0, 0, 0) linear-gradient(276deg, rgb(214, 37, 96) 0%, rgb(84, 39, 142) 100%) repeat scroll 0% 0%'
    )
    cy.get('[data-test=toggleDarkMode]').click()
    cy.get('[data-test=appBar]').should('have.css', 'background-color', 'rgb(36, 36, 36)')
    cy.get('[data-test=toggleDarkMode]').click()
    cy.get('[data-test=appBar]').should(
      'have.css',
      'background',
      'rgba(0, 0, 0, 0) linear-gradient(276deg, rgb(214, 37, 96) 0%, rgb(84, 39, 142) 100%) repeat scroll 0% 0%'
    )
  })
})

export {}
