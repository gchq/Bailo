const baseURL = '/beta'
let modelUuid = ''
let accessRequestUuid = ''
const modelName = 'Test Model'
const schemaId = 'minimal-access-request-general-v10-beta'

describe('Make and approve an access request', () => {
  before(() => {
    cy.log('Upload new model and set schema via API')
    cy.request('POST', 'http://localhost:8080/api/v2/models', {
      name: modelName,
      teamId: 'Uncategorised',
      description: 'This is a test',
      visibility: 'public',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.model).to.have.property('name', modelName)
      modelUuid = response.body.model.id
      cy.request('POST', `/api/v2/model/${modelUuid}/setup/from-schema`, { schemaId: 'minimal-general-v10-beta' }).then(
        (response) => {
          expect(response.status).to.eq(200)
          expect(response.body.card).to.have.property('modelId', modelUuid)
        },
      )
    })
  })

  it('can make an access request', () => {
    cy.visit(`${baseURL}/model/${modelUuid}`)
    cy.contains(modelName)
    cy.get('[data-test=accessRequestTab]').click()
    cy.get('[data-test=accessRequestButton]').click()
    cy.url({ timeout: 15000 }).should('contain', `/beta/model/${modelUuid}/access-request/schema`)
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`, { timeout: 15000 }).click({
      force: true,
    })

    cy.get('body').contains('What is the name of the access request?')
    cy.get('#root_name').type('Test access request')
    cy.get('[data-test=submitAccessRequest]').click()

    cy.get('body').contains('Test access request')
    cy.url({ timeout: 15000 }).should('contain', `/beta/model/${modelUuid}/access-request`)

    cy.url().then((url) => {
      const splitUrl = url.split('/')
      accessRequestUuid = splitUrl[splitUrl.length - 1]
    })
  })

  it('can review an access request', () => {
    cy.visit(`${baseURL}/model/${modelUuid}/access-request/${accessRequestUuid}`)
    cy.get('[data-test=reviewButton]').click({ force: true })
    cy.get('[data-test=releaseReviewDialog]').contains('Access Request Review')
    cy.get('[data-test=reviewWithCommentInput').type('This is a comment')
    cy.get('[data-test=requestChangesReviewButton').click()

    cy.get('[data-test=accessRequestContainer').contains('user added a comment')
    cy.get('[data-test=accessRequestContainer').contains('user requested changes')
    cy.get('[data-test=accessRequestContainer').contains('This is a comment')
  })
})
