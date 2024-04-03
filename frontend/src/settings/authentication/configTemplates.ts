import Handlebars from 'handlebars'

export function viewRocketConfigTemplate(registry_url: string, access_key: string, secret_key: string) {
  return `rktKind: auth
rktVersion: v1
domains:
  - '${registry_url}'
type: basic
credentials:
  user: '${access_key}'
  password: '${secret_key}'`
}

export function kubeImagePullSecretsConfigExample(description: string) {
  return `apiVersion: v1
kind: Pod
metadata:
    name: somepod
    namespace: all
spec:
  containers:
    - name: web
      image: bailo.xxx.yyy.zzz/some-model-id/some-repo-id

  imagePullSecrets:
    - name: ${description}-secret.yml`
}

export function viewKubernetesSecretsConfigTemplate(
  description: string,
  registry_url: string,
  access_key: string,
  secret_key: string,
  auth: string,
) {
  return `apiVersion: v1
kind: Secret
metadata:
  name:  ${description}-secret
data:
  .dockerconfigjson:
    auths:
      '${registry_url}':
        username: '${access_key}'
        password: '${secret_key}'
        auth:  '${auth}''
type: kubernetes.io/dockerconfigjson`
}

export function viewDockerConfigTemplate(registry_url: string, access_key: string, secret_key: string, auth: string) {
  return `auths:
  '${registry_url}':
    username: '${access_key}'
    password: '${secret_key}'
    auth: '${auth}'`
}

export const dockerConfigTemplate = Handlebars.compile(`{
  "auths": {
    "{{registryUrl}}": {
      "username": "{{accessKey}}",
      "password": "{{secretKey}}",
      "auth": "{{auth}}"
    }
  }
}`)

export const kubernetesConfigTemplate = Handlebars.compile(`{
  "apiVersion": "v1",
  "kind": "Secret",
  "metadata": {
    "name": "<key-name>-secret"
  },
  "data": {
    ".dockerconfigjson": {
      "auths": {
        "{{registryUrl}}": {
          "username": "{{accessKey}}",
          "password": "{{secretKey}}",
          "auth": "{{auth}}"
        }
      }
    }
  },
  "type": "kubernetes.io/dockerconfigjson"
}
`)

export const rocketConfigTemplate = Handlebars.compile(`{
  "rktKind": "auth",
  "rktVersion": "v1",
  "domains": "{{registryUrl}}",
  "type": "basic",
  "credentials": {
    "user": "{{accessKey}}",
    "password": "{{secretKey}}"
  }
}`)
