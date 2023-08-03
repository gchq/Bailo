const betaModelUrl = 'localhost:8080/beta/model/new/model'

describe('Beta create new model', () => {
  it('loads the Create a new model Page', () => {
    cy.visit(betaModelUrl)
    cy.get('[data-test=createModelPageTitle]').contains('Create a new model')
  })

  it('creates a new model', () => {
    cy.visit(betaModelUrl)
    //typed team, model and description.
    cy.get('[data-test=team-selector]').type('test team')
    cy.get('[data-test=model-selector]').type('test model')
    cy.get('[data-test=modelDescription]').type('test description')

    // cy.get('[data-test=publicButtonSelector]').click()
    cy.get('[data-test=privateButtonSelector]').click()

    // cy.get('[data-test=createModelButton]').click()

    //selected team, typed model and description.
  })
})
