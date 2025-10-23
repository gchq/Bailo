/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

function printA11yViolations(violations) {
  summaryTable(violations)
  detailedIssue(violations)
}

function summaryTable(violations) {
  cy.task(
    'log',
    `${violations.length} accessibility violation${
      violations.length === 1 ? '' : 's'
    } ${violations.length === 1 ? 'was' : 'were'} detected`,
  )
  // pluck specific keys to keep the table readable
  const violationData = violations.map(({ id, impact, description, nodes }) => ({
    id,
    impact,
    description,
    nodes: nodes.length,
  }))

  cy.task('table', violationData)
}

function detailedIssue(violations) {
  violations.forEach((violation, indexInFailuresArray, array) => {
    const { id, impact, help, helpUrl, nodes } = violation

    cy.task(
      'log',
      `########## Issue ${indexInFailuresArray + 1} of ${array.length}: '${id}', impact ${impact} ##########`,
    )
    cy.task('log', `${help}. See ${helpUrl}`)
    cy.task('log', `${nodes.length} instance${nodes.length > 1 ? 's' : ''} of this issue:`)

    nodes.forEach((node, indexInNodesArray) => {
      cy.task(
        'log',
        `
      Issue ${indexInFailuresArray + 1} instance ${indexInNodesArray + 1}: ${node.html}`,
      )
    })
  })
}

export { printA11yViolations }
