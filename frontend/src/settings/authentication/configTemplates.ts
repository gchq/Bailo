import { toKebabCase } from 'utils/stringUtils'

export function getKubernetesSecretConfig(
  description: string,
  registryUrl: string,
  accessKey: string,
  secretKey: string,
  secretName: string,
) {
  return `apiVersion: v1
kind: Secret
metadata:
  name:  ${secretName}
data:
  .dockerconfigjson: ${btoa(
    `{"auths":{"${registryUrl}":{"username":"${accessKey}","password":"${secretKey}","auth":"${btoa(
      `${accessKey}:${secretKey}`,
    )}"}}}`,
  )}
type: kubernetes.io/dockerconfigjson`
}

export function getKubernetesImagePullSecretsExampleConfig(registryUrl: string, description: string) {
  return `apiVersion: v1
kind: Pod
metadata:
    name: somepod
    namespace: all
spec:
  containers:
    - name: web
      image: ${registryUrl}/some-model-id/some-repo-id

  imagePullSecrets:
    - name: ${secretName}`
}

export function getRktCredentialsConfig(registryUrl: string, accessKey: string, secretKey: string) {
  return JSON.stringify(
    {
      rktKind: 'auth',
      rktVersion: 'v1',
      domains: [`${registryUrl}`],
      type: 'basic',
      credentials: {
        user: `${accessKey}`,
        password: `${secretKey}`,
      },
    },
    null,
    2,
  )
}

export function getDockerCredentialsConfig(registryUrl: string, accessKey: string, secretKey: string) {
  return JSON.stringify(
    {
      auths: {
        [`${registryUrl}`]: {
          auth: btoa(`${accessKey}:${secretKey}`),
        },
      },
    },
    null,
    2,
  )
}
