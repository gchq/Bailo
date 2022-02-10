# Helm

1. Install `helm` and `kubectl`
2. `cd helm
3. `cd bailo && helm dependency update && cd ..`
4. `kubectl config set-context --current --namespace=bailo`
5. `helm install --create-namespace --values ./bailo/local.yaml bailo ./bailo`


To update

1. `export ROOT_USER=$(kubectl get secret bailo-minio -o jsonpath="{.data.root-user}" | base64 --decode)`
1. `export ROOT_PASSWORD=$(kubectl get secret bailo-minio -o jsonpath="{.data.root-password}" | base64 --decode)`
1. `helm upgrade -f ./bailo/local.yaml bailo ./bailo --set minio.auth.rootUser=$ROOT_USER --set minio.auth.rootPassword=$ROOT_PASSWORD`