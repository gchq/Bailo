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

export function kubeImagePullSecretsConfigTemplate() {
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
    - name: <key-name>-secret.yml`
}
