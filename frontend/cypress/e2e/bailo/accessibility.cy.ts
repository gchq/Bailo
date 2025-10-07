import 'cypress-axe'

import { terminalLog } from '../../support/commands'

describe('Check A11y violations', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.injectAxe()
  })

  it('Check A11y violations, Front Page', () => {
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })

  it('Check A11y violations, Review Page', () => {
    cy.get('a[href="/review"]').click()
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })

  it('Check A11y violations, API Page', () => {
    cy.get('a[href="/docs/api"]').click()
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })

  it('Check A11y violations, Python Docs Page', () => {
    cy.get('a[href="/docs/python/index.html"]').click()
    cy.injectAxe() //needs re-injecting due to visiting a fresh page
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })

  it('Check A11y violations, Help Page', () => {
    cy.get('a[href="/help"]').click()
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })

  it('Check A11y violations, Schemas Page', () => {
    cy.get('a[href="/schemas/list"]').click()
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })

  it('Check A11y violations, Review Roles Page', () => {
    cy.get('a[href="/reviewRoles/view"]').click()
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })

  it('Check A11y violations, Settings Page', () => {
    cy.get('a[href="/settings"]').click()
    cy.checkA11y(undefined, undefined, terminalLog, true)
  })
})
