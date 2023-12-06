const baseURL = '/beta/'
let modelUuid = ''
const modelName = 'Test Model'
const releaseVersion = '1.0.0'

describe('Draft and review a model release', () => {
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

  it('drafts a new release for a model', () => {
    cy.visit(`${baseURL}/model/${modelUuid}`)
    cy.get('body').contains(modelName)
    cy.get('[data-test=modelReleaseTab]').click({ force: true })
    cy.get('body').contains('Draft new Release')
    cy.get('[data-test=draftNewReleaseButton').click()
    cy.get('body').contains('A release takes a snapshot of the current state of the model code, files and model card')

    cy.get('[data-test=releaseSemanticVersion]').type(releaseVersion)
    cy.get('.w-md-editor-text-input').type('These are some release notes')
    cy.get('[data-test=fileInput]').selectFile('cypress/fixtures/test.txt', { force: true })
    cy.get('[data-test=createReleaseButton]', { timeout: 1500 }).click()
    cy.get('body').contains(`${modelName} - ${releaseVersion}`)
  })

  it('can review a release', () => {
    cy.visit(`${baseURL}/model/${modelUuid}/release/${releaseVersion}`)
    cy.get('body').contains(`${modelName} - ${releaseVersion}`)
    cy.get('[data-test=reviewButton]').click({ force: true })
    cy.get('[data-test=releaseReviewDialog]').contains('Release Review')
    cy.get('[data-test=reviewWithCommentInput').type('This is a comment')
    cy.get('[data-test=requestChangesReviewButton').click()
    cy.get('[data-test=reviewButton]').click({ force: true })
    cy.get('[data-test=releaseReviewDialog]').contains('Release Review')
    cy.get('[data-test=approveReviewButton').click()

    cy.get('[data-test=releaseContainer').contains('user added a comment')
    cy.get('[data-test=releaseContainer').contains('user requested changes')
    cy.get('[data-test=releaseContainer').contains('user approved')
    cy.get('[data-test=releaseContainer').contains('This is a comment')
  })

  /**
   * TODO -  We will need to update this test so that it once artefacts
   *  can be downloaded from the individual release page
   *  */
  it('can download a release artefact', () => {
    cy.visit(`${baseURL}/model/${modelUuid}?tab=releases  `)
    cy.get('body').contains('Draft new Release')
    // The following logic is to get around a known bug with Cypress and downloading files from anchor tags
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
