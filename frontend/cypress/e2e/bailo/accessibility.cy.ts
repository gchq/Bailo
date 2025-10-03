import 'cypress-axe'

import { terminalLog } from '../../support/commands'

describe('Check A11y violations', () => {
  // verify if doing a beforeAll works, given the apparent need to run the injectAxe command after any visit
  it('Check A11y violations', () => {
    cy.visit('/')
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' })
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })
})
