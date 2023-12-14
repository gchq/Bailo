// class InternalAuthorisation extends BaseAuthorisation {
//   constructor() {
//     super()
//   }

//   async models(user: UserDoc, models: ModelDoc[], action: ModelActionKeys): Promise<Response[]> {
//     const responses = await super.models(user, models, action)

//     await partials(
//       models,
//       responses,
//       responses.map((response) => response.success),
//       (batch) =>
//         pdp.checkUserEdhCall(
//           user.dn,
//           batch.map((model) => model.classification.edh),
//         ),
//     )

//     return responses
//   }
// }
