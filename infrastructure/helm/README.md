# Helm Chart Instructions

This document describes how to deploy **Bailo** to a Kubernetes cluster using **Helm**.

Helm allows us to package, install, upgrade, and remove Kubernetes applications using Helm charts. A chart defines the Kubernetes resources required for an application, and Helm manages their lifecycle on the target cluster.

## Prerequisites

Before installing Bailo, ensure the following are available:

- **Helm**
  <https://helm.sh/>

- **kubectl**
  <https://kubernetes.io/docs/tasks/tools/>

- **A running Kubernetes cluster**
  For example: AWS EKS or OpenShift.

- **kubectl configured to point at the target cluster**
  Verify with:

  ```bash
  kubectl cluster-info
  ```

## Assumptions and Context

All commands in this guide assume:

- You are running commands from the `helm/bailo` directory.
- The correct Kubernetes context and namespace are selected.
- The `bailo` namespace already exists.

### Set the namespace for the current context

```bash
kubectl config set-context --current --namespace=bailo
```

### Create the namespace (if it does not already exist)

```bash
kubectl create namespace bailo
```

## Configuration Overview

Helm values can be customised in two ways:

- By providing a values file: `--values <file>`
- By overriding individual values: `--set <option>=<value>`

This guide assumes you are using a values override file named **`local.yaml`**, located in the `helm/bailo` directory.

## Container Images

Bailo container images are hosted in [GitHub Container Registry](https://github.com/orgs/gchq/packages?repo_name=Bailo).

Alternatively, you may build and publish images yourself using the provided Dockerfiles. At a minimum, your configuration **must** specify the image repository and tag:

```yaml
---
image:
  repository: some.repository.com
  tag: 'latest'
```

### Building Images Locally

Images can be built from their respective directories:

- Frontend:

  ```console
  frontend$ docker build -t "frontend:<tag>" -f ./Dockerfile .
  ```

- Backend:

  ```console
  backend$ docker build -t "backend:<tag>" --build-context python=../lib/python -f ./Dockerfile .
  ```

- ArtefactScan:

  ```console
  lib/artefactscan$ docker build -t "artefactscan:<tag>" -f ./Dockerfile .
  ```

## Certificate Generation

### Backend Certificates

Basic TLS certificates should be placed in `backend/certs`.

Generate a self-signed certificate:

```bash
openssl genrsa -out key.pem 2048 && \
openssl req -new -x509 -key key.pem -out cert.pem -config san.cnf -extensions 'v3_req' -days 360
```

### JWKS for Registry Authentication

The registry requires a **JWKS (JSON Web Key Set)** file for token authentication with the backend application.

- **Development**
  Generate a JWKS file using:

  ```bash
  npm run certs
  ```

- **Production**
  Use the `generateJWKS.ts` script to generate a JWKS file corresponding to the public key referenced in the backend configuration.

## Minimal `local.yaml` for OpenShift Development Environment

> **Note:** ClamAV and ArtefactScan are optional.

```yaml
image:
  frontendRepository: 'image-registry-openshift-imagestreams'
  frontendTag: tag
  backendRepository: 'image-registry-openshift-imagestreams'
  backendTag: tag
  artefactscanRepository: 'image-registry-openshift-imagestreams'
  artefactscanTag: tag

route:
  enabled: true
  appPublicRoute: openshift-route-url

mongodb:
  auth:
    passwords:
      - mongodb-password
    usernames:
      - mongodb-user

clamav:
  enabled: true

artefactscan:
  enabled: true

connectors:
  artefactScanners:
    kinds: ['clamAV', 'artefactScan']

openshift:
  namespace: project-name
```

## EKS Development Environment Setup

The following steps outline a typical AWS EKS setup suitable for development:

1. [Push Docker images to Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html)

2. Edit the cluster configuration `infrastructure/eks/cluster.yaml`. Update the cluster name, region, and any other required parameters.

3. Create the cluster:

   ```bash
   eksctl create cluster -f infrastructure/eks/cluster.yaml
   ```

4. [Install the AWS Load Balancer Controller](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html)

5. [Configure persistent storage](https://repost.aws/knowledge-center/eks-persistent-storage).
   > **Note:** Helm `storage.yaml` uses `provisioner: ebs.csi.aws.com`

6. [Install the EBS CSI driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)

## Minimal `local.yaml` for AWS EKS Development Environment

> **Note:** ClamAV and ArtefactScan are optional.

```yaml
image:
  frontendRepository: 'container-registry'
  frontendTag: tag
  backendRepository: 'container-registry'
  backendTag: tag
  artefactscanRepository: 'container-registry'
  artefactscanTag: tag

ingress:
  enabled: true
  name: 'bailo-ingress'
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: instance
  fqdn: '*.amazonaws.com' #your url
  path: "/"
  pathType: "Prefix"
  service:
    name: "node-port"
    port: 8080

aws:
  enabled: true

mongodb:
  persistence:
    enabled: false
  auth:
    passwords:
      - mongodb-password
    usernames:
      - mongodb-user

minio:
  persistence:
    enabled: false

frontend:
  podSecurityContext:
    runAsUser: 1001

backend:
  podSecurityContext:
    runAsUser: 1001

clamav:
  enabled: true

artefactscan:
  enabled: true

connectors:
  artefactScanners:
    kinds: ['clamAV', 'artefactScan']

```

## Cognito Client Configuration (Optional)

The following example demonstrates configuring OAuth authentication using AWS Cognito:

```yaml
connectors:
  authentication:
    kind: 'oauth'

cookie:
  secret: 'random secret'

oauth:
  enabled: true
  origin: 'https://your-hosted-url'
  cognito:
    key: cognito key
    secret: cognito secret
    dynamic: "['scope']"
    response: "['tokens', 'raw', 'jwt']"
    callback: '/'
    subdomain: 'cognito domain'
    adminGroupName: 'cognito admin group if you have set one'
  identityProviderClient:
    userPoolId: "user pool"
    userIdAttribute: "email"
```

## Installing Bailo

1. Update chart dependencies:

   ```bash
   helm dependency update
   ```

2. Install Bailo:

   ```bash
   helm install --values ./local.yaml bailo .`
   ```

3. Verify installation:

   ```bash
   helm list
   ```

## Upgrade Bailo

To apply configuration or image changes:

```bash
helm upgrade --values ./local.yaml bailo .
```

## Testing the Deployment

Run Helm tests associated with the release:

```bash
helm test bailo
```

## Removing Bailo

To completely remove Bailo from the cluster:

```bash
helm uninstall bailo
```

## Parameters - Supplements `values.yaml`

The following tables describe selected configuration options available in `values.yaml`.

### Image Parameters

| Name | Description | Value |
| ---- | ----------- | ----- |
| `image.frontendRepository` | Frontend image location | `null` |
| `image.frontendTag` | Frontend image tag | `null` |
| `image.backendRepository` | Backend image location | `null` |
| `image.backendTag` | Backend image tag | `null` |
| `image.artefactscanRepository` | Artefactscan image location | `null` |
| `image.artefactscanTag` | Artefactscan image tag | `null` |
| `image.pullPolicy` | <https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy> | `IfNotPresent` |

### Pod Parameters

| Name | Description | Value |
| ---- | ----------- | ----- |
| `imagePullSecrets` | <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#containers> | `null` |
| `podAnnotations` | <https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/#attaching-metadata-to-objects> | `{}` |
| `replicaCount` | Ignored if autoscaling is enabled | `1` |
| `autoscaling.enabled` | <https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/> | `false` |
| `autoscaling.minReplicas` | HPA configuration | `1` |
| `autoscaling.maxReplicas` | HPA configuration | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | HPA configuration | `80` |
| `autoscaling.targetMemoryUtilizationPercentage` | HPA configuration | `80` |
| `podSecurityContext` | <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#security-context> | `{}` |
| `backend.podSecurityContext.readOnlyRootFilesystem` | <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#security-context> | `false` |
| `backend.podSecurityContext.runAsNonRoot` | Does not run as UID 0 (root) <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#security-context> | `true` |
| `frontend.podSecurityContext.readOnlyRootFilesystem` | <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#security-context> | `false` |
| `frontend.podSecurityContext.runAsNonRoot` | Does not run as UID 0 (root) <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#security-context> | `true` |
| `resources.limits.cpu` | Default pod cpu limits <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#alpha-level> | `400m` |
| `resources.limits.memory` | Default pod memory limits | `512Mi` |
| `resources.requests.cpu` | Default pod cpu requests | `200m` |
| `resources.requests.memory` | Default pod memory requests | `256Mi` |
| `resourcesFrontend.limits.cpu` | Default frontend pod cpu limits | `400m` |
| `resourcesFrontend.limits.memory` | Default frontend pod memory limits | `800Mi` |
| `resourcesFrontend.requests.cpu` | Default frontend pod cpu requests | `400m` |
| `resourcesFrontend.requests.memory` | Default frontend pod memory requests | `800Mi` |
| `resourcesBackend.limits.cpu` | Default backend pod cpu limits | `800m` |
| `resourcesBackend.limits.memory` | Default backend pod memory limits | `2Gi` |
| `resourcesBackend.requests.cpu` | Default backend pod cpu requests | `400m` |
| `resourcesBackend.requests.memory` | Default backend pod memory requests | `1Gi` |
| `nodeSelector` | Pod placement <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#scheduling> | `{}` |
| `tolerations` | Pod placement | `[]` |
| `affinity` | Pod placement | `{}` |

### Service Account parameters

| Name | Description | Value |
| ---- | ----------- | ----- |
| `backend.serviceAccount` | If set, service account can be used to connect Backend to S3 without using aws access and secret keys | `null` |
| `registry.serviceAccount` | If set, service account can be used to connect Registry to S3 without using aws access and secret keys | `null` |

### Network parameters

| Name | Description | Value |
| ---- | ----------- | ----- |
| `service.type` | Exposes the Service on a cluster-internal IP <https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types> | `ClusterIP` |
| `service.frontendPort` | Frontend port for Service to connect to | `3000` |
| `service.backendPort` | Frontend port for Service to connect to | `3001` |
| `ingress.enabled` | Map traffic to different backends based on rules you define via the Kubernetes API <https://kubernetes.io/docs/concepts/services-networking/ingress/> | `false` |
| `route.enabled` | OpenShift configuration used in lieu of Ingress | `false` |
| `route.appPublicRoute` | Public url for Bailo whilst using OpenShift | `false` |

### AWS-Specific Configurations

| Name | Description | Value |
| ---- | ----------- | ----- |
| `aws.enabled` | This is only a guide and depends on EKS setup. Enables Service NodePort, StorageClass and PersistentVolumeClaim for MinoIO and MongoDB.  See nodeport.yaml and storage.yaml | `false` |

### OAuth Configurations

| Name | Description | Value |
| ---- | ----------- | ----- |
| `cookie.secret` | A randomly generated secret key used to encrypt and sign session cookies, ensuring data security and integrity | `somerandomstring12341234567890AB` |
| `oauth.enabled` | Currently setup to use Cognito <https://aws.amazon.com/blogs/security/how-to-use-oauth-2-0-in-amazon-cognito-learn-about-the-different-oauth-2-0-grants/> | `false` |

### Bailo Supporting Service Configurations

| Name | Description | Value |
| ---- | ----------- | ----- |
| `nginxAuth.repository` | Runs Nginx as non-root unprivileged user | `nginxinc/nginx-unprivileged` |
| `mongodb.enabled` | Using bitnami chart 15.1.4. <https://artifacthub.io/packages/helm/bitnami/mongodb/15.1.4>. Also refer to Mongo host defination and Create the mongo connection URI in template/_helper.tpl | `true` |
| `minio.enabled` | Using bitnami chart 14.2.0. <https://artifacthub.io/packages/helm/bitnami/minio/14.2.0> | `true` |
| `mail.enabled` | Using image marlonb/mailcrab:latest | `true` |
| `registry.enabled` | Using image registry:3.0.0. Must use registry:3.0.0 if registry.serviceAccount is defined | `true` |
| `clamav.enabled` | Optional. Using image clamav/clamav:1.4.2_base | `false` |
| `artefactscan.enabled` | Optional. Image defined in image.artefactscanRepository | `false` |

### Bailo Instance Settings

| Name | Description | Value |
| ---- | ----------- | ----- |
| `config.ui.banner.enabled` | Enables banner at top of the page | `false` |
| `config.ui.banner.text` | Content of top banner | `BAILO` |
| `config.ui.banner.colour` | Colour of top banner | `#047a06` |
| `config.ui.banner.textColor` | Colour of top banner text | `black` |
| `config.announcement.enabled` | Enables announcement banner at bottom of the page | `false` |
| `config.announcement.text` | Content of announcement banner | `null` |
| `config.announcement.startTimestamp` | Start time of announcement banner | `null` |
| `config.helpPopoverText.manualEntryAccess` | Help text for manually adding a user to a model | `null` |
| `config.modelDetails.organisations` | Organisation options for models | `[]` |
| `config.modelDetails.states` | States options for models | `[]` |
| `config.smtp.port` | Backend connection port to mail server <https://nodemailer.com/smtp> | `1025` |
| `config.smtp.secure` | Enable to use TLS | `false` |
| `config.smtp.rejectUnauthorized` | TLS option | `false` |
| `config.smtp.user` | Auth username | `mailuser` |
| `config.smtp.pass` | Auth password | `mailpass` |
| `config.smtp.from` | Email address used by Bailo. When a review is required, for example | `bailo@example.com` |
| `config.app.protocol` | Used for external bailo url. See backed/src/services/smtp | `https` |
| `config.app.port` | Used for external bailo url | `443` |
| `config.issueLinks.support` | Help page email configuration | `mailto:?subject=Bailo%20Contact` |
| `config.issueLinks.contact` | Help page email configuration | `mailto:?subject=Bailo%20Contact` |
| `connectors.authentication.kind` | Name of the connector to be used for authentication | `silly` |
| `registry.certFile` | Ensure it matches cert name used in backend.deployment.yaml and registry.deployment.yaml | `cert.pem` |
| `registry.keyFile` | Ensure it matches key name in backend.deployment.yaml and registry.deployment.yaml | `key.pem` |
| `registry.jwksFile` | See generate certs section above | `jwks.json` |
| `connectors.authentication.kind` | Name of the connector to be used for authentication | `silly` |
| `connectors.authorisation.kind` | Name of the connector to be used for authorisation | `basic` |
| `connectors.audit.kind` | Name of the connector to be used for auditing | `silly` |
| `connectors.artefactScanners.kinds` | A list of the file scanner names to enable. See local.yaml example above | `[]` |
| `connectors.artefactScanners.retryDelayInMinutes` | Number of minutes between scans on a given file | `60` |
| `connectors.artefactScanners.maxInitRetries` | Number of times the microservice is attempted to be reached before failing at startup | `5` |
| `connectors.artefactScanners.initRetryDelay` | Delay between successive microservice pings in milliseconds | `5000` |
| `instrumentation.enabled` | Enable OpenTelemetry instrumentation | `false` |
| `instrumentation.debug` | Enable instrumentation debugging | `false` |
| `modelMirror.import.enabled` | Enable creation of mirrored models | `false` |
| `modelMirror.export.enabled` | Enable the exporting of models to S3 | `false` |
| `modelMirror.export.disclaimer` | Disclaimer shown to the user in the UI prior to exporting a model | `## Example Agreement \n I agree that this model is suitable for exporting` |
| `modelMirror.export.kmsSignature.enabled` | Enable the use of KMS signatures when exporting a model | `false` |
| `modelMirror.export.kmsSignature.keyId` | KMS key to use when signing an export | `123` |
| `modelMirror.export.kmsSignature.KMSClient.region` | AWS region for the KMS client | `eu-west-1` |
| `modelMirror.export.kmsSignature.KMSClient.` | Access key credential for the KMS client | `accessKey` |
| `modelMirror.export.kmsSignature.KMSClient.` | Secret key credential for the KMS client | `secretKey` |

### Inferencing Cluster Reference Configurations

| Name | Description | Value |
| ---- | ----------- | ----- |
| `inference.enabled` | Enable inferencing | `false` |
| `inference.host` | URL of inferencing cluster | `https://example.com` |
| `inference.gpus` | Available GPUs a user can select | null |
| `inference.authorizationTokenName` | Name of authorisation token | `inferencing-token` |
| `inference.authorisationToken` | Authorisation token used to connect to inferencing service | null |
