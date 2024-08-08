let modelUuid = ''
let accessRequestUuid = ''
const modelName = 'Test Model'
const schemaId = 'minimal-access-request-general-v10'
const accessRequestName = 'Test access request'

describe('Make and approve an access request', () => {
  before(() => {
    cy.log('Upload new model and set schema via API')
    cy.request('POST', 'http://localhost:8080/api/v2/models', {
      name: modelName,
      kind: 'model',
      teamId: 'Uncategorised',
      description: 'This is a test',
      visibility: 'public',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.model).to.have.property('name', modelName)
      modelUuid = response.body.model.id
      cy.request('POST', `/api/v2/model/${modelUuid}/setup/from-schema`, { schemaId: 'minimal-general-v10' }).then(
        (response) => {
          expect(response.status).to.eq(200)
          expect(response.body.card).to.have.property('modelId', modelUuid)
          cy.request('patch', `/api/v2/model/${modelUuid}`, {
            collaborators: [{ entity: 'user:user', roles: ['owner', 'mtr', 'msro'] }],
          }).then((response) => {
            expect(response.status).to.eq(200)
          })
        },
      )
    })
  })

  it('can make an access request', () => {
    cy.log('Navigating to the model page')
    cy.visit(`/model/${modelUuid}`)
    cy.contains(modelName)
    cy.log('Navigating to the access request list tab and clicking the request access button')
    cy.get('[data-test=accessTab]').click({ force: true })
    cy.get('[data-test=requestAccessButton]').click({ force: true })
    cy.log('Setting a schema for the access request')
    cy.url().should('contain', `/model/${modelUuid}/access-request/schema`)
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click({
      force: true,
    })

    cy.log('Creating the access request')
    cy.get('body').contains('Select a different schema')
    cy.get('[data-test=entitySelector]').contains('Joe Bloggs')
    cy.get('#root_name-label').contains('What is the name of the access request?')
    cy.get('#root_name').type(accessRequestName)
    cy.get('[data-test=createAccessRequestButton]', { timeout: 15000 }).click()

    cy.url().should('contain', `/model/${modelUuid}/access-request`)
    cy.get('[data-test=accessRequestContainer]').contains(accessRequestName)

    cy.url()
      .should('contain', `/model/${modelUuid}/access-request`)
      .then((url) => {
        const splitUrl = url.split('/')
        accessRequestUuid = splitUrl[splitUrl.length - 1]
      })
  })

  it('can review an access request', () => {
    cy.log('Navigating to the access request page')
    cy.visit(`/model/${modelUuid}/access-request/${accessRequestUuid}`)
    cy.log('Reviewing the access request and leaving comments')
    cy.get('[data-test=reviewButton]').click({ force: true })
    cy.contains(`Reviewing access request ${accessRequestName} for model ${modelName}`)
    cy.get('[data-test=reviewWithCommentTextField').type('This is a comment')
    cy.get('[data-test=requestChangesReviewButton').click()

    cy.visit(`/model/${modelUuid}/access-request/${accessRequestUuid}`)
    cy.get('[data-test=accessRequestContainer').contains('requested changes')
    cy.get('[data-test=accessRequestContainer').contains('This is a comment')
  })
})
