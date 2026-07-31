const instanceASourceModelName = 'Source Model'
const instanceASourceModelSummary = 'This model is uploaded to instance A.'

const instanceBDestinationModelName = 'Destination Model'

describe('Mirrored Model tests', () => {
  let instanceAUrl: string
  let instanceBUrl: string

  let instanceASourceModelId: string
  let instanceBDestinationModelId: string

  beforeEach(function () {
    cy.task('log', `TEST ${this.currentTest?.title}`)
  })

  before(() => {
    cy.task('log', `BEFORE START ${Date.now()}`)
    // Must get `let` vars in `before` otherwise they may not exist in subsequent tests
    instanceAUrl = Cypress.expose('instanceAUrl')
    instanceBUrl = Cypress.expose('instanceBUrl')

    cy.task('ensureExportsBucket')

    cy.request('POST', `${instanceAUrl}/api/v2/models`, {
      name: instanceASourceModelName,
      kind: 'model',
      description: 'Source model',
      visibility: 'public',
    }).then((response) => {
      instanceASourceModelId = response.body.model.id

      cy.request('POST', `${instanceBUrl}/api/v2/models`, {
        name: instanceBDestinationModelName,
        kind: 'mirrored-model',
        description: 'Destination model',
        visibility: 'public',
        settings: {
          mirror: {
            sourceModelId: instanceASourceModelId.slice(0, 6), // intentionally mangle now to test update source model ID later
          },
        },
      }).then((response) => {
        instanceBDestinationModelId = response.body.model.id
      })
    })
  })

  it('can reach both deployments', () => {
    cy.request(instanceAUrl).its('status').should('eq', 200)
    cy.request(instanceBUrl).its('status').should('eq', 200)
  })

  it('created source model on instance A', () => {
    expect(instanceASourceModelId).to.not.equal(undefined)
    cy.request('POST', `${instanceAUrl}/api/v2/model/${instanceASourceModelId}/setup/from-schema`, {
      schemaId: 'minimal-general-v10',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.card).to.have.property('modelId', instanceASourceModelId)

      cy.request('PUT', `${instanceAUrl}/api/v2/model/${instanceASourceModelId}/model-cards`, {
        metadata: {
          overview: {
            modelSummary: instanceASourceModelSummary,
          },
        },
      }).then((response) => {
        expect(response.status).to.eq(200)

        cy.visit(`${instanceAUrl}/model/${instanceASourceModelId}`)
        cy.contains(instanceASourceModelSummary)
      })
    })
  })

  it('created mirrored model on instance B', () => {
    expect(instanceBDestinationModelId).to.not.equal(undefined)

    // workaround for Cypress reloading browser when baseUrl-origin changes between tests (re-triggering `before` block)
    cy.origin(
      instanceBUrl,
      { args: { instanceBDestinationModelId: instanceBDestinationModelId } },
      ({ instanceBDestinationModelId }) => {
        cy.visit(`/model/${instanceBDestinationModelId}`)
        cy.contains('This mirrored model has no model card. Please export the model card from the source model.')
      },
    )
  })

  it("updated the mirrored model on instance B's source model ID", () => {
    cy.origin(
      instanceBUrl,
      { args: { instanceASourceModelId, instanceBDestinationModelId } },
      ({ instanceASourceModelId, instanceBDestinationModelId }) => {
        cy.visit(`/model/${instanceBDestinationModelId}`)
        cy.contains(instanceASourceModelId).should('not.exist')

        cy.get('[data-test=editMirroredModelSourceModelIdButton]').click()
        // `data-test` applies to the outer div - need to access inner input for `.clear()`
        cy.get('[data-test=editMirroredModelSourceModelIdInput]').within(() => {
          cy.get("input[type='text']").clear()
          cy.get("input[type='text']").type(instanceASourceModelId)
        })
        cy.get('[data-test=editMirroredModelSourceModelIdSave]').click()

        cy.visit(`/model/${instanceBDestinationModelId}`)
        cy.contains(instanceASourceModelId)
      },
    )
  })

  it("exported the source model on instance A's model card and imported to the mirrored model on instance B", () => {
    cy.visit(`${instanceAUrl}/model/${instanceASourceModelId}?tab=settings&category=mirrored_models`)
    cy.get('[data-test=createAccessRequestButton]').type(instanceBDestinationModelId)
    cy.contains('I agree that this model is suitable for exporting')
    cy.get('[data-test=destinationModelIdSaveButton]').click()

    cy.get('[data-test=exportModelAgreementCheckbox]').click()
    cy.get('[data-test=exportModelAgreementSubmitButton]').scrollIntoView().click()

    cy.wait(1000)

    cy.task('getSignedUrl', `${instanceASourceModelId}.tar.gz`).then((signedUrl) => {
      cy.origin(
        instanceBUrl,
        { args: { instanceBDestinationModelId, signedUrl, instanceASourceModelSummary } },
        ({ instanceBDestinationModelId, signedUrl, instanceASourceModelSummary }) => {
          cy.request('POST', '/api/v2/model/import/s3', {
            payloadUrl: signedUrl,
          }).then((response) => {
            expect(response.status).to.eq(200)

            cy.wait(1000)

            cy.visit(`/model/${instanceBDestinationModelId}`)
            cy.contains(instanceASourceModelSummary)
          })
        },
      )
    })
  })
})
