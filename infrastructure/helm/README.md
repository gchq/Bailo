### Helm Chart Instructions

Helm allows us to manage Kubernetes applications. We define a 'Helm chart' and then 'Helm' manages creating, updating
and destroying resources on a target Kubernetes cluster. To install Bailo using these guides you need the following
prerequisites:

- Helm (https://helm.sh/).
- Kubectl (https://kubernetes.io/docs/tasks/tools/).
- An existing Kubernetes cluster, AWS EKS for example.
- Kubectl pointing to EKS cluster (check with `kubectl cluster-info`).

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
  tag: 'latest'
```

This image can be built with `docker build -t bailo .` in the root directory. This guide assumes the overrides file is
called `local.yaml` in the `helm/bailo` folder.

#### Generate certs

Basic certs can be in `backend/certs`

1. `openssl genrsa -out key.pem 2048 && openssl req -new -x509 -key key.pem -out cert.pem -config san.cnf -extensions 'v3_req' -days 360`

#### Minimal local.yaml for OpenShift (Clamav and ModelScan are optional)

```yaml
image:
  frontendRepository: 'image-registry-openshift-imagestreams'
  frontendTag: tag
  backendRepository: 'image-registry-openshift-imagestreams'
  backendTag: tag
  modelscanRepository: 'image-registry-openshift-imagestreams'
  modelscanTag: tag

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

modelscan:
  enabled: true

openshift:
  namespace: project-name
```

#### EKS Build

1. https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
2. vim eks/cluster.yaml. Update name and region. Add / amend other parameters as necessary.
3. `eksctl create cluster -f infrastructure/eks/cluster.yaml`
4. https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html

#### Minimal local.yaml for AWS EKS (Clamav and ModelScan are optional)

```yaml
image:
  frontendRepository: 'aws-elastic-container-registry'
  frontendTag: tag
  backendRepository: 'aws-elastic-container-registry'
  backendTag: tag
  modelscanRepository: 'aws-elastic-container-registry'
  modelscanTag: tag

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

securityContext:
  runAsUser: 1001

clamav:
  enabled: true

modelscan:
  enabled: true
```

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

### Parameters - supplements values.yaml

#### Image parameters
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `image.frontendRepository`  | frontend image location | `null`  |
| `image.frontendTag`  | frontend image tag | `null`  |
| `image.backendRepository`  | backend image location | `null`  |
| `image.backendTag`  | backend image tag | `null`  |
| `image.modelscanRepository`  | modelscan image location | `null`  |
| `image.modelscanTag`  | modelscan image tag | `null`  |
| `image.pullPolicy`  | https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy  | `IfNotPresent` |


#### Pod parameters
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `imagePullSecrets`  | https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#containers | `null` |
| `podAnnotations`  | https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/#attaching-metadata-to-objects  | `{}` |
| `replicaCount`  | ignored if autoscaling is enabled | `1` |
| `autoscaling.enabled`  | https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/ | `false` |
| `autoscaling.minReplicas`  | HPA configuration | `1` |
| `autoscaling.maxReplicas`  | HPA configuration | `10` |
| `autoscaling.targetCPUUtilizationPercentage`  | HPA configuration | `80` |
| `autoscaling.targetMemoryUtilizationPercentage`  | HPA configuration | `80` |
| `podSecurityContext`  | https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#security-context | `{}` |
| `securityContext.readOnlyRootFilesystem`  | https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#security-context | `false` |
| `securityContext.runAsNonRoot`  | does not run as UID 0 (root) https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#security-context | `true` |
| `resources.limits.cpu`  | default pod cpu limits https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#alpha-level| `400m` |
| `resources.limits.memory`  | default pod memory limits | `512Mi` |
| `resources.requests.cpu`  | default pod cpu requests | `200m` |
| `resources.requests.memory`  | default pod memory requests | `256Mi` |
| `resourcesFrontend.limits.cpu`  | default pod cpu limits https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#alpha-level| `400m` |
| `resourcesFrontend.limits.memory`  | default pod memory limits | `800Mi` |
| `resourcesFrontend.requests.cpu`  | default pod cpu requests | `400m` |
| `resourcesFrontend.requests.memory`  | default pod memory requests | `800Mi` |
| `resourcesBackend.limits.cpu`  | default pod cpu limits https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#alpha-level| `800m` |
| `resourcesBackend.limits.memory`  | default pod memory limits | `2Gi` |
| `resourcesBackend.requests.cpu`  | default pod cpu requests | `400m` |
| `resourcesBackend.requests.memory`  | default pod memory requests | `1Gi` |
| `nodeSelector`  | pod placement https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#scheduling | `{}` |
| `tolerations`  | pod placement | `[]` |
| `affinity`  | pod placement | `{}` |

#### Service Account parameters
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `backend.serviceAccount`  | if set, service account can be used to connect Backend to S3 without using aws access and secret keys | `null` |
| `registry.serviceAccount` | if set, service account can be used to connect Registry to S3 without using aws access and secret keys | `null` |


#### Network parameters
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `service.type`  | exposes the Service on a cluster-internal IP https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types  | `ClusterIP` |
| `service.frontendPort`  | frontend port for Service to connect to | `3000` |
| `service.backendPort`  | frontend port for Service to connect to | `3001` |
| `ingress.enabled `  |  map traffic to different backends based on rules you define via the Kubernetes API https://kubernetes.io/docs/concepts/services-networking/ingress/ | `false`  |
| `route.enabled`  | OpenShift configuration used in lieu of Ingress https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/networking/configuring-routes#route-configuration  | `false` |
| `route.appPublicRoute`  | public url for Bailo whilst using OpenShift | `false` |

#### AWS specific configuration
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `aws.enabled` | this is only a guide and depends on EKS setup. Enable Service NodePort, StorageClass and PersistentVolumeClaim for MinoIO and MongoDB.  See nodeport.yaml and storage.yaml | `false` |

#### OAuth configuration
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `cookie.secret`  | a randomly generated secret key used to encrypt and sign session cookies, ensuring data security and integrity   | `somerandomstring12341234567890AB` |
| `oauth.enabled`  | currently setup to use Cognito. https://aws.amazon.com/blogs/security/how-to-use-oauth-2-0-in-amazon-cognito-learn-about-the-different-oauth-2-0-grants/   | `false` |

#### Bailo supporting service configurations
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `nginxAuth.repository`  | runs Nginx as non-root unprivileged user  | `nginxinc/nginx-unprivileged` |
| `mongodb.enabled`  | using bitnami chart 15.1.4. https://artifacthub.io/packages/helm/bitnami/mongodb/15.1.4. Also refer to Mongo host defination and Create the mongo connection URI in template/_helper.tpl  | `true` |
| `minio.enabled`  | using bitnami chart 14.2.0. https://artifacthub.io/packages/helm/bitnami/minio/14.2.0  | `true` |
| `mail.enabled`  | using image marlonb/mailcrab:latest  | `true` |
| `registry.enabled`  | using image registry:3.0.0. Must use regitsry:3.0.0 if registry.serviceAccount is defined  | `true` |
| `registry.jwksFile`  | Registry requires a JWKS file for the token authentication with the backend application. For development, a JWKS file is generated by running `npm run certs`. For production, the script `generateJWKS.ts` can be used to generate a JWKS file for the public key referenced in the backend application configuration.  | `jwks.json` |
| `clamav.enabled`  | optional. Using image clamav/clamav:1.4.2_base   | `false` |
| `modelscan.enabled`  | optional. Image defined in image.modelscanRepository  | `false` |

#### Bailo instance settings
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `config.ui.banner.enabled`  | enables banner at top of the page  | `false`  |
| `config.ui.banner.text`  | content of top banner | `BAILO`  |
| `config.ui.banner.colour`  | colour of top banner  | `#047a06`  |
| `config.ui.banner.textColor`  | colour of top banner text  | `black`  |
| `config.announcement.enabled`  | enables announcement banner at bottom of the page  | `false`  |
| `config.announcement.text`  | content of announcement banner  | `null`  |
| `config.announcement.startTimestamp`  | start time of announcement banner  | `null`  |
| `config.helpPopoverText.manualEntryAccess`  | ----  | `null`  |
| `config.modelDetails.organisations`  | organisation options for models  | `[]`  |
| `config.modelDetails.states`  | states options for models  | `[]`  |
| `config.smtp.port`  | backend connection port to mail server. https://nodemailer.com/smtp  | `1025`  |
| `config.smtp.secure`  | enable to use TLS   | `false`  |
| `config.smtp.rejectUnauthorized`  | TLS option | `false`  |
| `config.smtp.user`  | auth username  | `mailuser`  |
| `config.smtp.pass`  | auth password  | `mailpass`  |
| `config.smtp.from`  | email address used by Bailo, When a review is required, for example  | `bailo@example.com`  |
| `config.app.protocol`  | used for external bailo url. See backed/src/services/smtp   | `https`  |
| `config.app.port`  | used for external bailo url  | `443`  |
| `config.issueLinks.support`  | help page email configuration  | `mailto:?subject=Bailo%20Contact`  |
| `config.issueLinks.contact`  | help page email configuration | `mailto:?subject=Bailo%20Contact`  |
| `nginxcert.cert`  | ----  | `cert.pem`  | ???
| `nginxcert.key`  | ----   | `key.pem`  | ????
| `connectors.authentication.kind`  | ----  | `silly`  |
| `connectors.authorisation.kind`  | ----  | `basic`  |
| `connectors.audit.kind`  | ----  | `silly`  |
| `connectors.fileScanners.kinds` | a list of the file scanner names to enable  | `[]`  |
| `connectors.fileScanners.retryDelayInMinutes` | number of minutes between scans on a given file   | `60`  |
| `connectors.fileScanners.maxInitRetries` | number of times the microservice is attempted to be reached before failing at startup  | `5`    |
| `connectors.fileScanners.initRetryDelay` | delay between successive microservice pings in milliseconds    | `5000` |
| `instrumentation.enabled`  | ----  | `false`  |
| `instrumentation.debug`  | ----  | `false`  |
| `modelMirror.import.enabled`  | ----  | `false`  |
| `modelMirror.export.enabled`  | ----  | `false`  |
| `modelMirror.export.disclaimer`  | ----## Example Agreement \n I agree that this model is suitable for exporting  | ``  |
| `modelMirror.export.kmsSignature.enabled`  | ----  | `false`  |
| `modelMirror.export.kmsSignature.keyId`  | ----  | `123`  |
| `modelMirror.export.kmsSignature.KMSClient.region`  | ----  | `eu-west-1`  |
| `modelMirror.export.kmsSignature.KMSClient.`  | ----  | `accessKey`  |
| `modelMirror.export.kmsSignature.KMSClient.`  | ----  | `secretKey`  |

#### Inferencing cluster reference configurations
| Name  | Description  | Value |
| ----  | ----------  | ----- |
| `inference.enabled`  | enable infrencing  | `false`  |
| `inference.host`  | url of infrencing cluster  | `https://example.com`  |
| `inference.gpus`  | ----  | ``  | ???
| `inference.authorizationTokenName`  | ----  | `inferencing-token`  | ???
| `inference.authorisationToken`  | ----  | ``  | ???

