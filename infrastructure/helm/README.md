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

```yaml
---
image:
  repository: some.repository.com/bailo
  tag: "latest"
```

This image can be built with `docker build -t bailo .` in the root directory. This guide assumes the overrides file is
called `local.yaml` in the `helm/bailo` folder.

#### Generate certs

Basic certs can be in `backend/certs`

1. `openssl genrsa -out key.pem 2048 && openssl req -new -x509 -key key.pem -out cert.pem -config san.cnf -extensions 'v3_req' -days 360`

#### Minimal local.yaml for OpenShift

```yaml
image:
  frontendRepository: "image-registry-openshift-imagestreams"
  frontendTag: tag
  backendRepository: "image-registry-openshift-imagestreams"
  backendTag: tag

route:
  enabled: true
  appPublicRoute: openshift-route-url

mongodb:
  auth:
    passwords:
      - mongodb-password
    usernames:
      - mongodb-user

openshift:
  namespace: project-name
```

#### Minimal local.yaml for AWS

```yaml
image:
  frontendRepository: "aws-elastic-container-registry"
  frontendTag: tag
  backendRepository: "aws-elastic-container-registry"
  backendTag: tag

ingress:
  enabled: true
  name: "bailo-ingress"
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: instance
  fqdn: "*.amazonaws.com"

aws:
  enabled: true

mongodb:
  persistence:
    enabled: false
    existingClaim: bailo-mongodb
  auth:
    passwords:
      - mongodb-password
    usernames:
      - mongodb-user

minio:
  persistence:
    enabled: false
    existingClaim: bailo-minio
```

#### EKS Build

1. https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
2. vim eks/cluster.yaml. Update name and region.
3. `eksctl create cluster -f infrastructure/eks/cluster.yaml`
4. https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html

#### Install Bailo

1. `helm dependency update`
2. `helm install --values ./local.yaml bailo .`
3. `helm list # list current deployments`

#### Upgrade Bailo

1. `helm upgrade --values ./local.yaml bailo .`

#### Test Bailo infrastructure

1. `helm test bailo`

#### Removing Bailo

1. `helm uninstall bailo`
