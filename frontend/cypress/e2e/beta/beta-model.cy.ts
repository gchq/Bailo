export const betaModelUrl = '/beta/model/new'

describe('Beta create new model', () => {
  it('loads the Create a new model Page', () => {
    cy.visit(betaModelUrl)
    cy.get('[data-test=createModelPageTitle]').contains('Create a new model')
  })

  it('creates a public new model', () => {
    cy.visit(betaModelUrl)

    //team selected. model and description typed.
    cy.get('[data-test=teamSelector]').click({ force: true })
    cy.get('[role=presentation]', { timeout: 15000 }).click()
    cy.get('[data-test=modelSelector]').type('test model')
    cy.get('[data-test=modelDescription]').type('test description')

    cy.get('[data-test=privateButtonSelector]').click()
    cy.get('[data-test=createModelButton]', { timeout: 15000 }).click()
    cy.get('[data-test=createModelCardOverview]')
  })

  it('creates a private new model', () => {
    cy.visit(betaModelUrl)

    //team, model and description typed.
    cy.get('[data-test=teamSelector]').type('test team', { force: true })
    cy.get('[data-test=modelSelector]').type('test model')
    cy.get('[data-test=modelDescription]').type('test description')

    cy.get('[data-test=privateButtonSelector]').click()
    cy.get('[data-test=createModelButton]', { timeout: 15000 }).click()
    cy.get('[data-test=createModelCardOverview]')
  })
})
