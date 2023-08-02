import model from '../new/model'

describe('Beta create new model', () => {
  before(() => {
    cy.visit('localhost:8080/beta/model/new/model')
  })
})

it('loads the Create a new model Page', () => {
  cy.visit('localhost:8080/beta/model/new/model')
  cy.get('[data-test=createModelPageTitle]').contains('Create a new model')
})

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
