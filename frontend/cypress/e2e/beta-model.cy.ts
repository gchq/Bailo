const betaModelUrl = 'localhost:8080/beta/model/new/model'

describe('Beta create new model', () => {
  it('loads the Create a new model Page', () => {
    cy.visit(betaModelUrl)
    cy.get('[data-test=createModelPageTitle]').contains('Create a new model')
  })

  it('creates a new model', () => {
    cy.visit(betaModelUrl)
    cy.get('[data-test=teamSelector]').click()
    // cy.get('[data-test=modelSelector]').select()
    // cy.get('[data-test=modelDescription]').type()

    // cy.get('[data-test=publicButtonSelector]').click()
    //   cy.get('[data-test=privateButtonSelector]').click()

    // cy.get('[data-test=createModelButton]').click()
  })
})
