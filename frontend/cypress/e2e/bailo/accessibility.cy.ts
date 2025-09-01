import 'cypress-axe'

import { terminalLog } from '../../support/commands'

describe('Check A11y violations', () => {
  // verify if doing a beforeAll works, given the apparent need to run the injectAxe command after any visit
  it('Check A11y violations', () => {
    cy.visit('/')
    cy.injectAxe()
    cy.checkA11y(null, null, terminalLog, true)
  })
})
