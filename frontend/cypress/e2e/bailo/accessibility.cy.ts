import 'cypress-axe'

import { printA11yViolations } from '../../support/commands'

describe('Check A11y violations', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.injectAxe()
    cy.configureAxe({ rules: [{ id: 'page-has-heading-one', enabled: false }] })
    // expand sidebar to avoid cypress errors ("element cannot be interacted with")
    // force: true HERE needed to click "behind" the dev next.js loading button
    cy.get(`[aria-label="toggle side drawer expansion"]`).click({ force: true })
  })

  it('Check A11y violations, Front Page', () => {
    cy.checkA11y(undefined, undefined, printA11yViolations)
  })

  it('Check A11y violations, Review Page', () => {
    cy.get('a[href="/review"]').click()
    cy.checkA11y(undefined, undefined, printA11yViolations)
  })

  it('Check A11y violations, API Page', () => {
    cy.get('a[href="/api/v2/docs"]').click()
    cy.checkA11y(undefined, undefined, printA11yViolations)
  })

  it('Check A11y violations, Python Docs Page', () => {
    cy.get('a[href="/docs/python/index.html"]').click()
    cy.checkA11y(undefined, undefined, printA11yViolations)
  })

  it('Check A11y violations, Help Page', () => {
    cy.get('a[href="/help"]').click()
    cy.checkA11y(undefined, undefined, printA11yViolations)
  })

  it('Check A11y violations, Schemas Page', () => {
    cy.get('a[href="/schemas/list"]').click()
    cy.checkA11y(undefined, undefined, printA11yViolations)
  })

  it('Check A11y violations, Review Roles Page', () => {
    cy.get('a[href="/reviewRoles/view"]').click()
    cy.get('h1').contains('Review Roles').should('be.visible')
    cy.checkA11y(undefined, undefined, printA11yViolations)
  })

  it('Check A11y violations, Settings Page', () => {
    cy.get('a[href="/settings"]').click()
    cy.checkA11y(undefined, undefined, printA11yViolations)
  })
})
