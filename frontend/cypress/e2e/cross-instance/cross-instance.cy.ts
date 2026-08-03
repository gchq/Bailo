const instanceASourceModelName = 'Source Model'
const instanceASourceModelSummary = 'This model is uploaded to instance A.'
const instanceASourceModelReleaseSemver = '1.0.0'
const instanceASourceModelReleaseDescription = 'The first release!'

const instanceBDestinationModelName = 'Destination Model'

const testDockerImage = 'testmodelimage'
const testDockerImageTag = '1'
const testFile = 'test.txt'

describe('Mirrored Model tests', () => {
  let instanceAUrl: string
  let instanceBUrl: string

  let instanceASourceModelId: string
  let instanceBDestinationModelId: string

  before(() => {
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

        cy.request('POST', `${instanceAUrl}/api/v2/user/tokens`, {
          description: 'Docker cross instance integration test',
          scope: 'all',
          modelIds: [instanceASourceModelId],
          actions: ['model:read', 'model:write', 'image:read', 'image:write'],
        }).then((response) => {
          expect(response.status).to.eq(200)
          const accessKey = response.body.token.accessKey
          const secretKey = response.body.token.secretKey

          cy.exec(`docker login ${instanceAUrl} -u ${accessKey} -p ${secretKey}`, { timeout: 60000 })
          const testDockerImageName = `${testDockerImage}:${testDockerImageTag}`
          const testDockerImageFull = `${instanceAUrl.replace('http://', '')}/${instanceASourceModelId}/${testDockerImageName}`
          cy.exec(`docker build --tag ${testDockerImage} cypress/fixtures/docker-image`, { timeout: 60000 })
          cy.exec(`docker tag ${testDockerImage} "${testDockerImageFull}"`, {
            timeout: 60000,
          })
          cy.exec(`docker push "${testDockerImageFull}"`, {
            timeout: 60000,
          })

          cy.fixture(testFile).then((file) => {
            cy.request(
              'POST',
              `${instanceAUrl}/api/v2/model/${instanceASourceModelId}/files/upload/simple?name=${testFile}&mime=text/plain`,
              file,
            ).then((response) => {
              expect(response.status).to.eq(200)
              const fileId = response.body.file.id

              cy.request('POST', `${instanceAUrl}/api/v2/model/${instanceASourceModelId}/releases`, {
                modelId: instanceASourceModelId,
                semver: instanceASourceModelReleaseSemver,
                notes: instanceASourceModelReleaseDescription,
                minor: false,
                fileIds: [fileId],
                images: [
                  {
                    repository: instanceASourceModelId,
                    name: testDockerImage,
                    tag: testDockerImageTag,
                  },
                ],
                modelCardVersion: 2,
              })

              cy.visit(`${instanceAUrl}/model/${instanceASourceModelId}/release/${instanceASourceModelReleaseSemver}`)
              cy.contains(instanceASourceModelReleaseDescription)
              cy.contains(testFile)
              cy.contains(testDockerImageName)
            })
          })
        })
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

  it('exported the model card on instance A and imported to instance B', () => {
    cy.visit(`${instanceAUrl}/model/${instanceASourceModelId}?tab=settings&category=mirrored_models`)
    cy.get('[data-test=destinationModelIdTextField]').type(instanceBDestinationModelId)
    cy.contains('I agree that this model is suitable for exporting')
    cy.get('[data-test=destinationModelIdSaveButton]').click()

    cy.get('[data-test=exportModelAgreementCheckbox]').click()
    cy.get('[data-test=exportModelAgreementSubmitButton]').scrollIntoView().click()

    cy.task('getSignedUrl', `${instanceASourceModelId}.tar.gz`).then((signedUrl) => {
      cy.origin(
        instanceBUrl,
        { args: { instanceBDestinationModelId, signedUrl, instanceASourceModelSummary } },
        ({ instanceBDestinationModelId, signedUrl, instanceASourceModelSummary }) => {
          cy.request('POST', '/api/v2/model/import/s3', {
            payloadUrl: signedUrl,
          }).then((response) => {
            expect(response.status).to.eq(200)

            cy.visit(`/model/${instanceBDestinationModelId}`)
            cy.contains(instanceASourceModelSummary, { timeout: 15000 })
          })
        },
      )
    })
  })

  it('exported the updated model card and release with artefacts on instance A and imported to instance B', () => {
    cy.request('PUT', `${instanceAUrl}/api/v2/model/${instanceASourceModelId}/model-cards`, {
      metadata: {
        overview: {
          modelSummary: instanceASourceModelSummary,
          metrics: [
            {
              name: 'accuracy',
              value: 100,
            },
          ],
        },
      },
    }).then((response) => {
      expect(response.status).to.eq(200)

      cy.visit(`${instanceAUrl}/model/${instanceASourceModelId}?tab=settings&category=mirrored_models`)
      cy.contains('I agree that this model is suitable for exporting')
      cy.get('[data-test=exportModelAgreementCheckbox]').click()

      cy.get('[data-test=releaseSelectorSelectReleasesButton]').click({ force: true })
      cy.get(`[data-test="releaseSelectorSemverCheckbox${instanceASourceModelReleaseSemver}"]`).click()
      cy.get('[data-test=releaseSelectorConfirmReleasesButton]').click()

      cy.get('[data-test=exportModelAgreementSubmitButton]').scrollIntoView().click()

      cy.request(
        'GET',
        `${instanceAUrl}/api/v2/model/${instanceASourceModelId}/release/${instanceASourceModelReleaseSemver}`,
      ).then((response) => {
        expect(response.status).to.eq(200)
        const fileId = response.body.release.fileIds[0]
        const imageId = response.body.release.images[0].id

        cy.task('getSignedUrl', `${instanceASourceModelId}.tar.gz`).then((signedModelUrl) => {
          cy.task('getSignedUrl', `${fileId}.tar.gz`).then((signedFileUrl) => {
            cy.task('getSignedUrl', `${imageId}.tar.gz`).then((signedImageUrl) => {
              const testDockerImageName = `${testDockerImage}:${testDockerImageTag}`
              cy.origin(
                instanceBUrl,
                {
                  args: {
                    instanceBDestinationModelId,
                    signedModelUrl,
                    signedFileUrl,
                    signedImageUrl,
                    instanceASourceModelReleaseSemver,
                    instanceASourceModelReleaseDescription,
                    testFile,
                    testDockerImageName,
                  },
                },
                ({
                  instanceBDestinationModelId,
                  signedModelUrl,
                  signedFileUrl,
                  signedImageUrl,
                  instanceASourceModelReleaseSemver,
                  instanceASourceModelReleaseDescription,
                  testFile,
                  testDockerImageName,
                }) => {
                  cy.request('POST', '/api/v2/model/import/s3', {
                    payloadUrl: signedModelUrl,
                  }).then((response) => {
                    expect(response.status).to.eq(200)

                    cy.request('POST', '/api/v2/model/import/s3', {
                      payloadUrl: signedFileUrl,
                    }).then((response) => {
                      expect(response.status).to.eq(200)

                      cy.request('POST', '/api/v2/model/import/s3', {
                        payloadUrl: signedImageUrl,
                      }).then((response) => {
                        expect(response.status).to.eq(200)

                        cy.visit(`/model/${instanceBDestinationModelId}/release/${instanceASourceModelReleaseSemver}`)
                        cy.contains(instanceASourceModelReleaseDescription, { timeout: 15000 })
                        cy.contains(testFile)
                        cy.contains(testDockerImageName)
                      })
                    })
                  })
                },
              )
            })
          })
        })
      })
    })
  })
})
