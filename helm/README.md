### Helm Chart Instructions

Helm allows us to manage Kubernetes applications. We define a 'Helm chart' and then 'Helm' manages creating, updating and destroying resources on a target Kubernetes cluster. To install Bailo using these guides you need the following prerequisites:

- Helm (https://helm.sh/)
- Kubectl (https://kubernetes.io/docs/tasks/tools/)
- An existing AWS EKS cluster
- Kubectl pointing to EKS cluster (check with `kubectl cluster-info`)

All commands assume they are run in `helm/bailo` in the right context. Context can be set with:

1. `kubectl config set-context --current --namespace=bailo`

#### Install Bailo

1. `helm dependency update`
2. `helm install --create-namespace --values ./local.yaml bailo .`
3. `helm list # list current deployments`

#### Upgrade Bailo

Initially get the existing secrets used for the cluster. These are needed to bring up the new containers.

1. `export ROOT_USER=$(kubectl get secret bailo-minio -o jsonpath="{.data.root-user}" | base64 --decode)`
2. `export ROOT_PASSWORD=$(kubectl get secret bailo-minio -o jsonpath="{.data.root-password}" | base64 --decode)`
3. `helm upgrade --values ./local.yaml bailo . --set minio.auth.rootUser=$ROOT_USER --set minio.auth.rootPassword=$ROOT_PASSWORD`

#### Removing Bailo

1. `helm uninstall bailo`
