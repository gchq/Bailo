import 'cypress-axe'

const schemaId = 'minimal-deployment-assessment-schema-v1'

//TO-DO create model to add to DA

describe('Deployment Assessment Suite', () => {
  it('goes to new deployment assessment page', () => {
    cy.visit('/deployment-assessments')
    cy.get('[data-test=createButton').click()
    cy.url().should('contain', '/deployment-assessments/new')
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click()
    cy.get('#_r_hm_').type('user').press(Cypress.Keyboard.Keys.DOWN).press(Cypress.Keyboard.Keys.ENTER)
    cy.get('#_r_hp_').type('createDATestModel').press(Cypress.Keyboard.Keys.DOWN).press(Cypress.Keyboard.Keys.ENTER)
    cy.get('#root_deploymentSummary').type('This is a deployment')
    cy.get('#_r_ip_').type('30062099')
    cy.get('[data-test=submitDeploymentAssessmentButton]').click().wait(500)
  })
})
