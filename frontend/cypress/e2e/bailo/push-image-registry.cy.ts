const BASE_URL = Cypress.config('baseUrl')
let modelUuidForRegistry = ''
const modelNameForRegistry = 'Test Model'
let registryUrl = ''
const testModelImage = 'testmodelimage'
const testModelImageTag = '1'
const testModelMultiplatformImageTag = 'multiplatform'
const platforms = 'linux/amd64,linux/arm64'

describe('Make and approve an access request', () => {
  before(() => {
    cy.log('Upload new model and set schema via API')
    cy.request('POST', 'http://localhost:8080/api/v2/models', {
      name: modelNameForRegistry,
      kind: 'model',
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
    cy.get('[data-test=allActionsCheckbox]').click()
    cy.get('[data-test=generatePersonalAccessTokenButton]').click()

    cy.log('Saving access key and secret key')
    cy.get('[data-test=toggleAccessKeyButton]').click()
    cy.get('[data-test=accessKeyText]').invoke('text').as('accessKey')
    cy.get('[data-test=toggleSecretKeyButton]').click()
    cy.get('[data-test=secretKeyText]').invoke('text').as('secretKey')
  })

  it('can push a single-platform image to the registry', function () {
    const registryImage = `${registryUrl}/${modelUuidForRegistry}/${testModelImage}:${testModelImageTag}`
    cy.log('Running all the docker commands to push an image')
    cy.exec(`docker login ${registryUrl} -u ${this.accessKey} -p ${this.secretKey}`, { timeout: 60000 })
    cy.exec(`docker build --tag ${testModelImage} cypress/fixtures/docker-image`, { timeout: 60000 })
    cy.exec(`docker tag ${testModelImage} ${registryImage}`, {
      timeout: 60000,
    })
    cy.exec(`docker push ${registryImage}`, {
      timeout: 60000,
    })
  })

  it('can select the image when drafting a release', () => {
    cy.log('Navigating to the model page and then to the releases tab')
    cy.visit(`/model/${modelUuidForRegistry}`)
    cy.contains(modelNameForRegistry)
    cy.get('[data-test=releasesTab]').click({ force: true })
    cy.log('Opening the draft release page to see if we can see our image in the drop down list')
    cy.contains('Draft new release')
    cy.get('[data-test=draftNewReleaseButton').click({ force: true })
    cy.get('[data-test=imageListAutocomplete').type(testModelImageTag)
    cy.contains(testModelImageTag)
    cy.contains(`${testModelImage}`)
  })

  it('can push a multiplatform image to the registry', function () {
    const registryImage = `${registryUrl}/${modelUuidForRegistry}/${testModelImage}:${testModelMultiplatformImageTag}`
    cy.log('Running all the docker commands to build and push a multi-platform image')
    cy.exec(`docker login ${registryUrl} -u ${this.accessKey} -p ${this.secretKey}`, { timeout: 60000 })
    cy.exec(
      `docker buildx build --platform ${platforms} --tag ${registryImage} --output=type=registry,registry.insecure=true --push cypress/fixtures/docker-image`,
      {
        timeout: 180000,
      },
    )

    cy.log('Verifying the pushed image contains both target platforms')
    cy.exec(`docker buildx imagetools inspect ${registryImage}`, {
      timeout: 60000,
    }).then(({ stdout }) => {
      expect(stdout).to.contain('linux/amd64')
      expect(stdout).to.contain('linux/arm64')
    })
  })

  it('can select the multiplatform image when drafting a release', () => {
    cy.log('Navigating to the model page and then to the releases tab')
    cy.visit(`/model/${modelUuidForRegistry}?tab=releases`)
    cy.log('Opening the draft release page to see if we can see our image in the drop down list')
    cy.contains('Draft new release')
    cy.get('[data-test=draftNewReleaseButton').click({ force: true })
    cy.get('[data-test=imageListAutocomplete').type(testModelMultiplatformImageTag)
    cy.contains(testModelMultiplatformImageTag)
    cy.contains(`${testModelImage}`)
  })
})
