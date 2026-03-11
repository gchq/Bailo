import { AgentOptions } from 'node:https'

import { ResponseChecksumValidation } from '@aws-sdk/middleware-flexible-checksums'
import { Provider } from '@aws-sdk/types'
import _config from 'config'
import grant from 'grant'
import { LevelWithSilentOrString } from 'pino'

import { ArtefactScanKindKeys } from '../connectors/artefactScanning/index.js'
import { AuditKindKeys } from '../connectors/audit/index.js'
import { AuthenticationKindKeys } from '../connectors/authentication/index.js'
import { AuthorisationKindKeys } from '../connectors/authorisation/index.js'
import { DefaultReviewRole } from '../services/review.js'
import { DefaultSchema } from '../services/schema.js'
import { FederationStateKeys, RemoteFederationConfig, UiConfig } from '../types/types.js'
import { deepFreeze } from './object.js'

/**
 * Transport mechanism used for outbound email.
 */
export type TransportOption = 'smtp' | 'aws'

export interface Config {
  /** ### API
   *
   * Express [`listen`](https://expressjs.com/en/api.html#app.listen) configuration.
   * These values define where the backend API binds internally. This is functionally the same as [http.Server.listen()](https://nodejs.org/api/http.html#http_server_listen), and will bind connections to nginx at `/api/v2`.
   */
  api: {
    /** @deprecated Host is unused and ignored */
    host: string
    /** Port number to expose the express backend on (usually 3001) */
    port: number
  }

  /** ### App
   *
   * Public-facing application metadata used in:
   *  - email links
   *  - registry authentication
   *
   * During build time certificates are generated with open SSL. These are used to authenticate the backend against the registry.
   * You can generate the certificates manually using `npm run certs`
   *
   * */
  app: {
    /** URL scheme used in generated links (e.g. https) */
    protocol: string
    /** Public domain or hostname used in emails */
    host: string
    /** Public port used in email links */
    port: number

    /** X.509 private key for registry authentication */
    privateKey: string

    /** X.509 public certificate for registry token verification */
    publicKey: string
    /** JSON Web Key Set used by the registry */
    jwks: string
  }

  /** ### HTTP Client
   *
   * Default options for outbound HTTP/S requests.
   */
  httpClient: {
    /** Default [HTTPS](https://nodejs.org/api/https.html#class-httpsagent) agent options (proxy, TLS, etc.) */
    defaultOpts: AgentOptions
  }

  /** ### Connectors
   *
   * Defines which external systems Bailo integrates with.
   */
  connectors: {
    /** Authentication strategy
     *  - 'silly' - No authentication every user is Joe Blogs
     *  - 'oauth' - Uses open authorisation to authenticate users.
     */
    authentication: {
      kind: AuthenticationKindKeys
    }

    /** Authorisation strategy
     *  - 'basic' - Usual checks on access apply
     */
    authorisation: {
      kind: AuthorisationKindKeys
    }

    /** Audit strategy
     *  - 'silly' - No events are tracked
     *  - 'stdout' - Events are streamed via standard output
     */
    audit: {
      kind: AuditKindKeys
    }

    /** Artefact scanners
     *  Information specific to how Bailo connects with the file and image scanners
     */
    artefactScanners: {
      /** Enabled artefact scanners */
      kinds: ArtefactScanKindKeys[]
      /** Retry delay between scan attempts of a given artefact (minutes) */
      retryDelayInMinutes: number
      /** Maximum number of initialisation retries */
      maxInitRetries: number
      /** Retry delay between initialisation attempts (minutes) */
      initRetryDelay: number
    }
  }

  /** ### Federation
   *
   * Enables searching and discovery across Bailo peers.
   */
  federation: {
    /** Status of federation search
     * - 'enabled' - Creates peer connections
     * - 'readOnly' - Used for creating a peer itself without any peers
     * - 'disabled' - Doesn't create peer connections
     */
    state: FederationStateKeys
    /** Unique peer identifier */
    id: string
    /** Allow escalation across federated peers */
    isEscalationEnabled?: boolean
    /** Known federation peers */
    peers: Record<string, RemoteFederationConfig>
  }

  /** ### SMTP / Email
   *
   * Controls outbound email behaviour.
   */
  smtp: {
    /** Enable or disable all email sending */
    enabled: boolean
    /** Transport provider */
    transporter: TransportOption

    /** SMTP Connection
     *
     * Connection information for an SMTP server.  Settings are passed directly to [`node-mailer`](https://nodemailer.com/smtp/#1-single-connection).
     * */
    connection: {
      /** Hostname for SMTP */
      host: string
      /** SMTP port */
      port: number
      secure: boolean
      auth: {
        user: string
        pass: string
      }
      /** Additional options for making requests with an email socket */
      tls: {
        rejectUnauthorized: boolean
      }
    }
    /** From address used by Bailo, can be different from the SMTP server details. */
    from: string
  }

  /** ### AWS SES */
  ses: {
    endpoint: string
    /** AWS region */
    region: string
  }

  /** ### Logging */
  log: {
    /** Pino log level */
    level: LevelWithSilentOrString
  }

  /** ### S3/Object storage
   *
   * Defines storage behavior. Used for all artifacts including:
   * - registry artifacts
   * - files
   */
  s3: {
    /** Object store credentials (do not store in plaintext in production) */
    credentials: {
      accessKeyId: string
      secretAccessKey: string
    }

    endpoint: string
    /** AWS region */
    region: string
    forcePathStyle: boolean
    rejectUnauthorized: boolean
    responseChecksumValidation: ResponseChecksumValidation | Provider<ResponseChecksumValidation>

    /** Automatically create buckets if missing */
    automaticallyCreateBuckets: boolean
    /** Multipart upload chunk size (bytes) */
    multipartChunkSize: number

    /** ### Bucket names
     *
     * default bucket names for uploads/files and registry/images
     */
    buckets: {
      /** Bucket name for the bucket to upload files to */
      uploads: string
      /** Bucket name for image uploads */
      registry: string
    }
  }

  /** ### MongoDB
   *
   * A mongo connection URI, can contain [replica set information, etc.](https://www.mongodb.com/docs/manual/reference/connection-string/)
   **/
  mongo: {
    /** MongoDB connection URI (no credentials embedded) */
    uri: string
    /** Username override (for secret-based auth) */
    user: string
    /** Password override (for secret-based auth) */
    pass: string
    /** Enable MongoDB transactions (requires replica set) */
    transactions: boolean
  }

  /** ### Registry */
  registry: {
    /**
     * Defines service information about the registry
     */
    connection: {
      /** Internal registry endpoint */
      internal: string
      /** Allow self‑signed certificates */
      insecure: boolean
    }

    /** Registry audience */
    service: string
    /** Registry issuer */
    issuer: string
    /** @deprecated use connection.insecure */
    insecure: boolean
  }

  /** ### UI Configuration
   *
   * Some features on the UI are dynamic and customisable.
   *
   * The UI object contains all information that is user facing.
   */
  ui: UiConfig

  /** ### Session
   *
   * Secret used to sign express-sessions should be difficult to parse by a human
   *
   * Should be rotated as best practice
   */
  session: {
    /** Express session signing secret */
    secret: string
  }

  /** ### OAuth/OpenID Connect
   *
   * Defines behaviour for user authorisation if the connector is enabled
   */
  oauth: {
    /** Redirect for the login to set a session cookie */
    provider: string
    /** [Grant configuration](https://www.npmjs.com/package/grant) options */
    grant: grant.GrantConfig | grant.GrantOptions

    /** Cognito
     *
     * Defines configuration for Open Authorisation
     */
    cognito: {
      /** Cognito identity provider client */
      identityProviderClient: {
        /** AWS Region */
        region: string
        /** Credentials to access Cognito */
        credentials: {
          /** Cognito access key */
          accessKeyId: string
          /** Cognito secret key */
          secretAccessKey: string
        }
      }
      userPoolId: string
      userIdAttribute: string
      /** Cognito admin group name */
      adminGroupName: string
    }
  }

  /** ### Default Schemas
   *
   * Defines default schemas that are loaded on startup. Use require to import.
   *
   * eg. `require('../src/scripts/example_schemas/minimal_model_schema.json')`
   */
  defaultSchemas: {
    /** Model card schemas that define the model card forms */
    modelCards: DefaultSchema[]
    /** Access request schemas that define the access request forms */
    accessRequests: DefaultSchema[]
    /** Data card schemas that define the data card forms*/
    dataCards: DefaultSchema[]
  }

  /** Roles that can be used after startup */
  defaultReviewRoles: DefaultReviewRole[]

  /** ### Instrumentation */
  instrumentation: {
    /** Enable open telemetry for performance metrics */
    enabled: boolean
    /** defined as per [https://github.com/open-telemetry/opentelemetry-js/blob/main/semantic-conventions/README.md#unstable-semconv] */
    serviceName: string
    /** Trace exporter host */
    endpoint: string
    /** Authorisation header using the Bearer scheme */
    authenticationToken: string
    /** Sets logger level to debug */
    debug: boolean
  }

  /** ### Artefact Scanning
   *
   * Scanning for files and images within models, including AV and CVEs.
   *
   * Scanners operate a priority queue
   */
  artefactScanning: {
    /** ### Clam Antivirus
     *
     * ClamAV is an open-source file scanning toolkit.
     *
     * This section gives some configuration for Bailo to access the container in order to scan files
     *
     */
    clamdscan: {
      /** Number of files scanned at one time */
      concurrency: number
      /** Internal address to model scan API */
      host: string
      /** Port number for model scan api */
      port: number
    }
    /** ### Artefactscan
     *
     * Artefactscan includes Trivy and ModelScan
     *
     * - [ModelScan](https://github.com/protectai/modelscan) is an open source tool to scan specifically on models
     * - [Trivy](https://github.com/aquasecurity/trivy) identifies known vulnerabilities in container image layers
     *
     * [Bailo Artefactscan REST API](https://github.com/gchq/Bailo/blob/main/lib/artefactscan_api/README.md)
     *
     */
    artefactscan: {
      concurrency: number
      /** Scheme or protocol associated with model scan API */
      protocol: string
      /** Internal address to model scan API */
      host: string
      /** Port number for model scan API */
      port: number
    }
  }

  /** ### Model Mirroring
   *
   * Used to compress model artifacts and export them. Pipes all model artifacts into a tarball
   *
   */
  modelMirror: {
    /** File name to store metadata such as source and target model */
    metadataFile: string
    /** Directory name of packaged files */
    contentDirectory: string
    /** Export Information */
    export: {
      /** Number of models to export at once */
      concurrency: number
      /** Maximum file size to allow for export*/
      maxSize: number
      /** Bucket name to export to storage. Buckets should be created before performing export */
      bucket: string
      /** Key Management Service */
      kmsSignature: {
        enabled: boolean
        keyId: string
        KMSClient: {
          region: string
          credentials: {
            accessKeyId: string
            secretAccessKey: string
          }
        }
      }
    }
  }
  /** ### Inference
   */
  inference: {
    /** Shared authorisation token for inference backends */
    authorisationToken: string
  }
}

const config = _config.util.toObject(_config)
export default deepFreeze(config) as Config
