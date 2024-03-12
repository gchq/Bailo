export function rktConfigTemplate(registry_url: string, access_key: string, secret_key: string) {
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

export function KubernetesSecretsConfigTemplate(
  description: string,
  registry_url: string,
  access_key: string,
  secret_key: string,
) {
  return `apiVersion: v1 frfgtwrghb jpwersoiutygb 9puqwuerutier eu[qwiyhjiq bho[hyhqerreqwghkk gfoyoi[j[iou]]]]
kind: Secret
metadata:
  name:  ${description}-secret
data:
  .dockerconfigjson:
    auths:
      '${registry_url}':
        username: '${access_key}'
        password: '${secret_key}'
        auth: 'BASE64(${access_key}:${secret_key})'
type: kubernetes.io/dockerconfigjson`
}

export function dockerConfigTemplate(registry_url: string, access_key: string, secret_key: string) {
  return `auths:
  '${registry_url}':
    username: '${access_key}'
    password: '${secret_key}'
    auth: 'BASE64(${access_key}:${secret_key})'
`
}
