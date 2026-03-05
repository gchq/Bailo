import getUuidFromUrl from '../../utils/getUuidFromUrl'

const newModelUrl = '/entry/new'

let modelUuid = ''
const schemaId = 'minimal-general-v10'
const accessReqSchemaId = 'minimal-access-request-general-v10'
const semver = '0.0.1'
const notes = 'Test notes.'
let accessReqId = ''

describe('Create new model', () => {
  it('loads the Create a new model Page', () => {
    cy.visit(newModelUrl)
    cy.get('[data-test=createModelButton]').click()
    cy.contains('Create Model')
  })

  it('creates a public new model', () => {
    cy.visit(newModelUrl)
    cy.get('[data-test=createModelButton]').click()

    cy.get('[data-test=entryNameInput]').type('test model', { force: true })
    cy.get('[data-test=entryDescriptionInput]').type('test description', { force: true })

    cy.get('[data-test=publicButtonSelector]').click()
    cy.get('[data-test=createEntryButton]').click()
    cy.get('[data-test=createEntryCardOverview]')

    cy.log('Checking URL has been updated')
    cy.url()
      .as('modelUrl')
      .should('contain', `/model/`)
      .then((url) => {
        modelUuid = getUuidFromUrl(url)
      })
  })

  it('creates a private new model', () => {
    cy.log('Navigating to the new model page')
    cy.visit(newModelUrl)
    cy.get('[data-test=createModelButton]').click()

    cy.log('Filling out the form to make a private model and submitting')
    cy.get('[data-test=entryNameInput]').type('test model', { force: true })
    cy.get('[data-test=entryDescriptionInput]').type('test description', { force: true })

    cy.get('[data-test=privateButtonSelector]').click()
    cy.get('[data-test=createEntryButton]').click()
    cy.get('[data-test=createEntryCardOverview]')
  })

  it('can set a schema for a newly created model', () => {
    cy.visit(`/model/${modelUuid}`)
    cy.contains('Create a model card')
    cy.get('[data-test=createSchemaFromScratchButton]').click()
    cy.log('Checking URL has been updated')
    cy.url().should('contain', `/model/${modelUuid}/schema`)
    cy.get(`[data-test=selectSchemaButton-${schemaId}]`).click({
      multiple: true,
      force: true,
    })
    cy.url().should('not.contain', '/schema')
    cy.visit(`/model/${modelUuid}`)
    cy.contains('Edit model card', { timeout: 5000 })
  })

  // it('can create release on an existing model', () => {
  //   cy.intercept('POST', `/api/v2/model/${modelUuid}/releases`).as('postRelease')
  //   cy.visit(`/model/${modelUuid}`)
  //   cy.contains(modelUuid)

  //   cy.log('Navigating to releases tab to draft a new release')
  //   cy.get('[data-test=releasesTab]').click({ force: true })
  //   cy.contains('Draft new release')
  //   cy.get('[data-test=draftNewReleaseButton').click()
  //   cy.contains('A release takes a snapshot of the current state of the model code, files and model card')

  //   cy.log('Filling out release form and submitting')
  //   cy.get('[data-test=releaseSemanticVersionTextField]').type(releaseVersion, { force: true })
  //   cy.get('.w-md-editor-text-input').type('These are some release notes', { force: true })
  //   cy.get('[data-test=uploadFileButton]').selectFile('cypress/fixtures/test.txt', { force: true })
  //   cy.get('[data-test=createReleaseButton]').click({ force: true })
  //   cy.wait('@postRelease')
  //   cy.url().should('contain', `release/${releaseVersion}`)
  // })

  it('can edit an existing model', () => {
    cy.log('Navigating to an existing model')
    cy.visit(`/model/${modelUuid}`)
    cy.log('Test that we can edit the model card')
    cy.contains('Edit model card')
    cy.get('[data-test=editEntryCardButton]').click({ force: true })
    // Wait for debounce to finish rendering change
    cy.get('#root_modelSummary').type('This is a test summary', { force: true }).wait(500)
    cy.get('[data-test=cancelEditEntryCardButton]').click({ force: true })
    cy.contains('This is a test summary').should('not.exist')
    cy.get('[data-test=openEntryOverviewActions]').click()
    cy.get('[data-test=editEntryCardButton]').click({ force: true })
    // Wait for debounce to finish rendering change
    cy.get('#root_modelSummary').type('This is a test summary', { force: true }).wait(500)
    cy.get('[data-test=saveEntryCardButton]').click({ force: true })
    cy.contains('This is a test summary')
  })

  it('can view the model card history of an existing model', () => {
    cy.log('Navigating to an existing model')
    cy.visit(`/model/${modelUuid}`)
    cy.log('Test that we can edit the model card')
    cy.get('[data-test=openEntryOverviewActions]').click()
    cy.contains('View History')
    cy.get('[data-test=viewHistoryButton]').click()
    cy.contains('Model Card History')
    cy.visit(`/model/${modelUuid}/history/1`)
    cy.contains('Back to model')
  })

  it('can soft delete the model', () => {
    cy.intercept('DELETE', '/api/v2/model/*').as('deleteModel')
    cy.request('POST', `/api/v2/model/${modelUuid}/releases`, {
      semver,
      notes,
      fileIds: [],
      images: [],
    }).then((response) => {
      expect(response.status).to.eq(200)
      cy.request('POST', `/api/v2/model/${modelUuid}/access-requests`, {
        schemaId: accessReqSchemaId,
        metadata: { overview: { entities: ['user:user'], endDate: '2029-03-05', name: 'test' } },
      }).then((response) => {
        accessReqId = response.body.accessRequest.id
        cy.log('Navigating to existing model settings')
        cy.visit(`/model/${modelUuid}`)
        cy.log('Go to settings tab')
        cy.get('[data-test=settingsTab]').click()
        cy.log('Select deletion menu button')
        cy.get('[data-test=entryDeletionMenuItem]').should('be.visible').wait(500).click()
        cy.log('Delete Entry')
        cy.get('[data-test=deleteEntryButton]').click()
        cy.get('[data-test=deleteEntryInputVerification]').type('test model', { force: true })
        cy.get('[data-test=deleteEntryConfirm]').click()
        cy.wait('@deleteModel')
        cy.title().should('equal', 'Marketplace · Bailo')
        cy.visit(`/model/${modelUuid}`)
        cy.contains('Not Found: The requested entry was not found.')
        cy.visit(`/model/${modelUuid}/release/${semver}`)
        cy.contains('Not Found: The requested entry was not found.')
        cy.visit(`/model/${modelUuid}/access-request/${accessReqId}`)
        cy.contains('Not Found: The requested access request was not found.')
      })
    })
  })
})
