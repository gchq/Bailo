export function rktConfigTemplate(registry_url, access_key, secret_key) {
  return `rktKind: auth
rktVersion: v1
domains:
  - '${registry_url}'
type: basic
credentials:
  user: '${access_key}'
  password: '${secret_key}'`
}

export function kubeImagePullSecretsConfigExample(description) {
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

export function KubernetesSecretsConfigTemplate(registry_url, access_key, secret_key) {
  return `apiVersion: v1
kind: Secret
metadata:
  name: <key-name>-secret
data:
  .dockerconfigjson:
    auths:
      '${registry_url}':
        username: '${access_key}'
        password: '${secret_key}'
        auth: 'BASE64(${access_key}:${secret_key})'
type: kubernetes.io/dockerconfigjson`
}

export function dockerConfigTemplate(registry_url, access_key, secret_key) {
  return `auths:
  '${registry_url}':
    username: '${access_key}'
    password: '${secret_key}'
    auth: 'BASE64(${access_key}:${secret_key})'
`
}
