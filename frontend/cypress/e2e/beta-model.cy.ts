const betaModelUrl = 'localhost:8080/beta/model/new/model'

describe('Beta create new model', () => {
  before(() => {
    cy.log('Navigate to beta create model page')
    cy.visit(betaModelUrl)
  })

  // it('loads the Create a new model Page', () => {
  //   cy.get('[data-test=createModelPageTitle]').contains('Create a new model')
  // })

  it('creates a new model', () => {
    //select team
    //select model
    // write description
    //click 'create model'
    // access control public v private

    cy.get('[data-test=teamSelector]').select()
    cy.get('[data-test=modelSelector]').select()
    cy.get('[data-test=modelDescription]').type()

    cy.get('[data-test=publicButtonSelector]').click()
    //   cy.get('[data-test=privateButtonSelector]').click()

    cy.get('[data-test=createModelButton]').click()
  })
})
