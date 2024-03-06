let modelUuidForRelease = ''
const modelNameForRelease = 'Test Model'
const releaseVersion = '1.0.0'

describe('Draft and review a model release', () => {
  before(() => {
    cy.log('Upload new model and set schema via API')
    cy.request('POST', 'http://localhost:8080/api/v2/models', {
      name: modelNameForRelease,
      teamId: 'Uncategorised',
      description: 'This is a test',
      visibility: 'public',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.model).to.have.property('name', modelNameForRelease)
      modelUuidForRelease = response.body.model.id
      cy.request('POST', `/api/v2/model/${modelUuidForRelease}/setup/from-schema`, {
        schemaId: 'minimal-general-v10',
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.card).to.have.property('modelId', modelUuidForRelease)
        cy.request('patch', `/api/v2/model/${modelUuidForRelease}`, {
          collaborators: [{ entity: 'user:user', roles: ['owner', 'mtr', 'msro'] }],
        }).then((response) => {
          expect(response.status).to.eq(200)
        })
      })
    })
  })

  it('drafts a new release for a model', () => {
    cy.visit(`/model/${modelUuidForRelease}`)
    cy.contains(modelNameForRelease)

    cy.log('Navigating to releases tab to draft a new release')
    cy.get('[data-test=releasesTab]').click({ force: true })
    cy.contains('Draft new Release')
    cy.get('[data-test=draftNewReleaseButton').click()
    cy.contains('A release takes a snapshot of the current state of the model code, files and model card')

    cy.log('Filling out release form and submitting')
    cy.get('[data-test=releaseSemanticVersionTextField]').type(releaseVersion, { force: true })
    cy.get('.w-md-editor-text-input').type('These are some release notes', { force: true })
    cy.get('[data-test=uploadFileButton]').selectFile('cypress/fixtures/test.txt', { force: true })
    cy.get('[data-test=createReleaseButton]', { timeout: 15000 }).click({ force: true })
    cy.url().should('contain', `release/${releaseVersion}`)
    cy.contains(`${modelNameForRelease} - ${releaseVersion}`)
    cy.contains('Back to model')
  })

  it('can review a release', () => {
    cy.log('Navigating to the release page')
    cy.visit(`/model/${modelUuidForRelease}/release/${releaseVersion}`)
    cy.contains(`${modelNameForRelease} - ${releaseVersion}`)
    cy.log('Clicking the review button')
    cy.get('[data-test=reviewButton]').parent().click()
    cy.log('Creating a "requesting changes" review')
    cy.get('[data-test=reviewWithCommentDialogContent]').should('be.visible')
    cy.get('[data-test=reviewWithCommentTextField]').type('This is a comment')
    cy.get('[data-test=requestChangesReviewButton]').click()
    cy.log('Approving a release')
    cy.get('[data-test=reviewButton]').parent().click()
    cy.get('[data-test=reviewWithCommentDialogContent]').should('be.visible')
    cy.get('[data-test=approveReviewButton]').click()

    cy.log('Checking that we can see both review states')
    cy.contains('requested changes')
    cy.contains('approved')
    cy.contains('This is a comment')
  })

  it('can edit an existing release', () => {
    cy.visit(`/model/${modelUuidForRelease}/release/${releaseVersion}`)
    cy.contains(`${modelNameForRelease} - ${releaseVersion}`)

    cy.log('Editing an existing release')
    cy.get('[data-test=editFormButton]').click({ force: true })
    cy.get('[data-test=releaseNotesInput]').type('This is an edit', { force: true })
    cy.log('Cancelling our changes and making sure they are no longer on the page')
    cy.get('[data-test=cancelEditFormButton]').click({ force: true })
    cy.contains('This is an edit').should('not.exist')
    cy.get('[data-test=editFormButton]').click({ force: true })
    cy.get('[data-test=releaseNotesInput]').type('This is an edit', { force: true })
    cy.get('[data-test=saveEditFormButton]').click({ force: true })
    cy.log('Checking our submitting edit has persisted')
    cy.contains('This is an edit')
  })

  it('can download a release artefact', () => {
    cy.log('Navigating to the releases tab for a model')
    cy.visit(`/model/${modelUuidForRelease}?tab=releases  `)
    cy.contains('Draft new Release')
    // The following logic is to get around a known bug with Cypress and downloading files from anchor tags
    cy.log('Clicking the test file that is attached to a release')
    cy.window()
      .document()
      .then(function (doc) {
        doc.addEventListener('click', () => {
          setTimeout(function () {
            doc.location.reload()
          }, 5000)
        })
        cy.get('[data-test="fileLink-test.txt"]').click()
        cy.readFile('cypress/downloads/test.txt')
      })
  })
})
