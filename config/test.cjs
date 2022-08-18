module.exports = {
  user: {
    id: 'user',
  },

  schemas: {
    model: 'Minimal Schema v10',
    deployment: 'Minimal Deployment Schema v6',
  },

  samples: {
    binary: '__tests__/example_models/minimal_model/minimal_binary.zip',
    code: '__tests__/example_models/minimal_model/minimal_code.zip',
    uploadMetadata: '__tests__/example_models/minimal_model/minimal_metadata.json',
    deploymentMetadata: '__tests__/example_models/minimal_model/deployment.json',
  },
}
