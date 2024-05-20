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
      kind: 'model',
      teamId: 'Uncategorised',
      description: 'This is a test',
      visibility: 'public',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.model).to.have.property('name', modelNameForRegistry)
      modelUuidForRegistry = response.body.model.id
      cy.request('POST', `/api/v2/model/${modelUuidForRegistry}/setup/from-schema`, {
        schemaId: 'minimal-general-v10',
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.card).to.have.property('modelId', modelUuidForRegistry)
      })
    })
    if (BASE_URL) {
      registryUrl = BASE_URL.replace('http://', '')
    }

    cy.log('Navigating to token generation page')
    cy.visit(`/settings/personal-access-tokens/new`)
    cy.get('[data-test=tokenDescriptionTextField]').type('This token works for all models')
    cy.get('[data-test=generatePersonalAccessTokenButton]').click()

    cy.log('Saving access key and secret key')
    cy.get('[data-test=toggleAccessKeyButton]').click()
    cy.get('[data-test=accessKeyText]').invoke('text').as('accessKey')
    cy.get('[data-test=toggleSecretKeyButton]').click()
    cy.get('[data-test=secretKeyText]').invoke('text').as('secretKey')
  })

  it('can push and pull to the registry', function () {
    cy.log('Running all the docker commands to push an image')
    cy.exec(`docker login ${registryUrl} -u ${this.accessKey} -p ${this.secretKey}`, { timeout: 60000 })
    cy.exec(`docker build --tag ${testModelImage} cypress/fixtures/docker-image`, { timeout: 60000 })
    cy.exec(`docker tag ${testModelImage} ${registryUrl}/${modelUuidForRegistry}/${testModelImage}:1`, {
      timeout: 60000,
    })
    cy.exec(`docker push ${registryUrl}/${modelUuidForRegistry}/${testModelImage}:1`, { timeout: 60000 })
  })

  it('can select the image when drafting a release', () => {
    cy.log('Navigating to the model page and then to the releases tab')
    cy.visit(`/model/${modelUuidForRegistry}`)
    cy.contains(modelNameForRegistry)
    cy.get('[data-test=releasesTab]').click({ force: true })
    cy.log('Opening the draft release page to see if we can see our image in the drop down list')
    cy.contains('Draft new Release')
    cy.get('[data-test=draftNewReleaseButton').click({ force: true })
    cy.get('[data-test=imageListAutocomplete').type('1')
    cy.contains('1')
    cy.contains(`${testModelImage}`)
  })
})
