// export const baseURL = '/beta/'

// let modelUuid = ''
// const modelName = 'Test Model'

// describe('Draft and review a model release', () => {
//   before(() => {
//     cy.log('Upload new model and set schema via API')
//     cy.request('POST', 'http://localhost:8080/api/v2/models', {
//       name: modelName,
//       teamId: 'Uncategorised',
//       description: 'This is a test',
//       visibility: 'public',
//     }).then((response) => {
//       expect(response.status).to.eq(200)
//       expect(response.body.model).to.have.property('name', modelName)
//       modelUuid = response.body.model.id
//       cy.request('POST', `/api/v2/model/${modelUuid}/setup/from-schema`, { schemaId: 'minimal-general-v10-beta' }).then(
//         (response) => {
//           expect(response.status).to.eq(200)
//           expect(response.body.card).to.have.property('modelId', modelUuid)
//         },
//       )
//     })
//   })

//   it('can make an access request', () => {
//     cy.visit(`${baseURL}/model/${modelUuid}`)
//     cy.get('body').contains(modelName)

//   })
// })
