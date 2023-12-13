const BASE_URL = Cypress.config('baseUrl')
let modelUuidForRegistry = ''
const modelNameForRegistry = 'Test Model'
let registryUrl = ''
const testModelImage = 'testmodelimage'

describe('Make and approve an access request', () => {
  before(() => {
    cy.log('Upload new model and set schema via API')
    cy.request('POST', 'http://localhost:8080/api/v2/models', {
      name: modelNameForRegistry,
      teamId: 'Uncategorised',
      description: 'This is a test',
      visibility: 'public',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.model).to.have.property('name', modelNameForRegistry)
      modelUuidForRegistry = response.body.model.id
      cy.request('POST', `/api/v2/model/${modelUuidForRegistry}/setup/from-schema`, {
        schemaId: 'minimal-general-v10-beta',
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.card).to.have.property('modelId', modelUuidForRegistry)
      })
    })
    if (BASE_URL) {
      registryUrl = BASE_URL.replace('http://', '')
    }
  })

  it('can push and pull to the registry', () => {
    cy.visit(`${BASE_URL}/beta/model/${modelUuidForRegistry}`)
    cy.contains(modelNameForRegistry)

    cy.get('[data-test=registryTab]').click()
    cy.get('[data-test=pushImageButton]').click()
    cy.contains('Pushing an Image for this Model')

    cy.get('[data-test=showTokenButton]').click()
    cy.get('[data-test=dockerPassword]').should('not.contain.text', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx')
    cy.get('[data-test=dockerPassword]')
      .invoke('text')
      .then({ timeout: 60000 }, (dockerPassword) => {
        cy.exec(`docker login ${registryUrl} -u ${'user'} -p ${dockerPassword}`)
        cy.exec(`docker build --tag ${testModelImage} cypress/fixtures/docker-image`)
        cy.exec(`docker tag ${testModelImage} ${registryUrl}/${modelUuidForRegistry}/${testModelImage}:1`)
        cy.exec(`docker push ${registryUrl}/${modelUuidForRegistry}/${testModelImage}:1`)
      })
  })

  it('can select the image when drafting a release', () => {
    cy.visit(`${BASE_URL}/beta/model/${modelUuidForRegistry}`)
    cy.contains(modelNameForRegistry)
    cy.get('[data-test=releasesTab]').click({ force: true })
    cy.contains('Draft new Release')
    cy.get('[data-test=draftNewReleaseButton').click({ force: true })
    cy.get('[data-test=imageListAutocomplete').type('1')
    cy.contains('1')
    cy.contains(`${testModelImage}`)
  })
})
