const BASE_URL = Cypress.config('baseUrl')
// Set in before(): Podman is often installed as a `docker` alias, so detect at runtime.
let containerCli = 'docker'
let isPodman = false
let tlsFlag = ''
let insecureManifestFlag = '--insecure'
let modelUuidForRegistry = ''
const modelNameForRegistry = 'Test Model'
let registryUrl = ''
const testModelImage = 'testmodelimage'
const testModelImageTag = '1'
const testModelMultiplatformImageTag = 'multiplatform'

describe('Make and approve an access request', () => {
  before(() => {
    containerCli = Cypress.expose('containerCli')
    cy.exec(`${containerCli} version`, { failOnNonZeroExit: false }).then(({ stdout }) => {
      expect(stdout, `${containerCli} version produced no output`).to.have.length.greaterThan(0)
      isPodman = /podman/i.test(stdout)
      tlsFlag = isPodman ? '--tls-verify=false' : ''
      insecureManifestFlag = isPodman ? '--tls-verify=false' : '--insecure'
    })

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
    cy.log('Running all the container commands to push an image')
    cy.exec(`${containerCli} login ${tlsFlag} ${registryUrl} -u ${this.accessKey} -p ${this.secretKey}`, {
      timeout: 60000,
    })
    cy.exec(`${containerCli} build --tag ${testModelImage} cypress/fixtures/docker-image`, { timeout: 60000 })
    cy.exec(`${containerCli} tag ${testModelImage} ${registryImage}`, {
      timeout: 60000,
    })
    cy.exec(`${containerCli} push ${tlsFlag} ${registryImage}`, {
      timeout: 60000,
    })
  })

  it('can select the image when creating a release', () => {
    cy.log('Navigating to the model page and then to the releases tab')
    cy.visit(`/model/${modelUuidForRegistry}`)
    cy.contains(modelNameForRegistry)
    cy.get('[data-test=releasesTab]').click({ force: true })
    cy.log('Opening the create release page to see if we can see our image in the drop down list')
    cy.contains('Create new release')
    cy.get('[data-test=createNewReleaseButton').click({ force: true })
    cy.get('[data-test=imageListAutocomplete').type(testModelImageTag)
    cy.contains(testModelImageTag)
    cy.contains(`${testModelImage}`)
  })

  it('can push a multiplatform image to the registry', function () {
    const registryImage = `${registryUrl}/${modelUuidForRegistry}/${testModelImage}:${testModelMultiplatformImageTag}`
    const amd64Image = `${registryUrl}/${modelUuidForRegistry}/${testModelImage}:${testModelMultiplatformImageTag}-amd64`
    const arm64Image = `${registryUrl}/${modelUuidForRegistry}/${testModelImage}:${testModelMultiplatformImageTag}-arm64`

    cy.log('Logging in to the registry')
    cy.exec(`${containerCli} login ${tlsFlag} ${registryUrl} -u ${this.accessKey} -p ${this.secretKey}`, {
      timeout: 60000,
    })

    cy.log('Building and pushing platform-specific images')
    cy.exec(`${containerCli} build --label "architecture=amd64" --tag ${amd64Image} cypress/fixtures/docker-image`, {
      timeout: 60000,
    })
    cy.exec(`${containerCli} push ${tlsFlag} ${amd64Image}`, { timeout: 60000 })

    cy.exec(`${containerCli} build --label "architecture=arm64" --tag ${arm64Image} cypress/fixtures/docker-image`, {
      timeout: 60000,
    })
    cy.exec(`${containerCli} push ${tlsFlag} ${arm64Image}`, { timeout: 60000 })

    cy.log('Creating and pushing multi-platform manifest list')
    if (isPodman) {
      cy.exec(`${containerCli} manifest create ${registryImage}`, { timeout: 60000 })
      cy.exec(`${containerCli} manifest add ${tlsFlag} --os linux --arch amd64 ${registryImage} ${amd64Image}`, {
        timeout: 60000,
      })
      cy.exec(`${containerCli} manifest add ${tlsFlag} --os linux --arch arm64 ${registryImage} ${arm64Image}`, {
        timeout: 60000,
      })
    } else {
      cy.exec(`${containerCli} manifest create --insecure ${registryImage} ${amd64Image} ${arm64Image}`, {
        timeout: 60000,
      })
      cy.exec(`${containerCli} manifest annotate ${registryImage} ${amd64Image} --os linux --arch amd64`)
      cy.exec(`${containerCli} manifest annotate ${registryImage} ${arm64Image} --os linux --arch arm64`)
    }
    cy.exec(`${containerCli} manifest push ${insecureManifestFlag} ${registryImage}`, { timeout: 60000 })

    cy.log('Verifying the pushed image contains both target platforms')
    cy.exec(`${containerCli} manifest inspect ${insecureManifestFlag} ${registryImage}`, {
      timeout: 60000,
    }).then(({ stdout }) => {
      const platforms = JSON.parse(stdout).manifests.map(
        ({ platform }: { platform: { os: string; architecture: string } }) => `${platform.os}/${platform.architecture}`,
      )
      expect(platforms).to.include('linux/amd64')
      expect(platforms).to.include('linux/arm64')
    })
  })

  it('can select the multiplatform image when creating a release', () => {
    cy.log('Navigating to the model page and then to the releases tab')
    cy.visit(`/model/${modelUuidForRegistry}?tab=releases`)
    cy.log('Opening the create release page to see if we can see our image in the drop down list')
    cy.contains('Create new release')
    cy.get('[data-test=createNewReleaseButton').click({ force: true })
    cy.get('[data-test=imageListAutocomplete').type(testModelMultiplatformImageTag)
    cy.contains(testModelMultiplatformImageTag)
    cy.contains(`${testModelImage}`)
  })
})
