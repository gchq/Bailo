### Helm Chart Instructions

Helm allows us to manage Kubernetes applications. We define a 'Helm chart' and then 'Helm' manages creating, updating
and destroying resources on a target Kubernetes cluster. To install Bailo using these guides you need the following
prerequisites:

- Helm (https://helm.sh/)
- Kubectl (https://kubernetes.io/docs/tasks/tools/)
- An existing AWS EKS cluster
- Kubectl pointing to EKS cluster (check with `kubectl cluster-info`)

All commands assume they are run in the `helm/bailo` directory with the right context. Context can be set with:

1. `kubectl config set-context --current --namespace=bailo`

All commands also assume that the namespace is already created, a namespace can be created with:

1. `kubectl create namespace bailo`

#### Configuration

Deployment options can be overridden by including a `--values <file containing overrides>` to a Helm command, or by
using `--set <option>=<value>`.

We do not host built images of Bailo, thus at the very minimum the configuration should include the location of a Bailo
image:

```
---
image:
  repository: some.repository.com/bailo
  tag: 'latest'
```

This image can be built with `docker build -t bailo .` in the root directory. This guide assumes the overrides file is
called `local.yaml` in the `helm/bailo` folder.

#### Install Bailo

1. `helm dependency update`
2. `ts-node --project ../../tsconfig.server.json createSecrets.ts`
3. `helm install --values ./local.yaml bailo .`
4. `helm list # list current deployments`

#### Upgrade Bailo

1. `helm upgrade --values ./local.yaml bailo .`

#### Removing Bailo

1. `helm uninstall bailo`
