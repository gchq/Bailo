import { AgentOptions } from 'node:https'

import { ResponseChecksumValidation } from '@aws-sdk/middleware-flexible-checksums'
import { Provider } from '@aws-sdk/types'
import bunyan from 'bunyan'
import _config from 'config'
import grant from 'grant'

import { AuditKindKeys } from '../connectors/audit/index.js'
import { AuthenticationKindKeys } from '../connectors/authentication/index.js'
import { AuthorisationKindKeys } from '../connectors/authorisation/index.js'
import { FileScanKindKeys } from '../connectors/fileScanning/index.js'
import { DefaultReviewRole } from '../services/review.js'
import { DefaultSchema } from '../services/schema.js'
import { FederationStateKeys, RemoteFederationConfig, UiConfig } from '../types/types.js'
import { deepFreeze } from './object.js'

export type TransportOption = 'smtp' | 'aws'

export interface Config {
  /** ### API
   *
   * These are parameters for Express app.Listen. This is functionally the same as [http.Server.listen()](https://nodejs.org/api/http.html#http_server_listen), and will bind connections to nginx at `/api/v2`.
   *
   * See [https://expressjs.com/en/api.html#app.listen](https://expressjs.com/en/api.html#app.listen) */
  api: {
    /** @deprecated Host is unused in our app */
    host: string
    /** Port number to expose the express backend on (usually 3001) */
    port: number
  }

  /** ### App
   *
   * These contain configuration for a where to direct users in emails and registry authentication
   *
   * During build time certificates are generated with open SSL. These are used to authenticate the backend against the registry.
   * You can generate the certificates manually using `npm run certs`
   *
   * */
  app: {
    /** The scheme or protocol used in email links (usually https)*/
    protocol: string
    /** The domain or subdomain used in email links */
    host: string
    /** The port number used in email links */
    port: number

    /** X.509 file used in generating a session between the backend and the registry */
    privateKey: string

    /** X.509 file used to verify tokens sent by the backend to the registry. */
    publicKey: string
    /** The JSON Web key set file that is used to verify the backend against the registry */
    jwks: string
  }

  httpClient: {
    /** Options in sending requests to external services using a proxy
     *  [https://nodejs.org/api/https.html#class-httpsagent]
     */
    defaultOpts: AgentOptions
  }

  /** ### Connectors
   *
   * Keyed settings that decide what external systems Bailo talks to
   *
   */
  connectors: {
    /** Authentication label
     *  - 'silly' - No authentication every user is Joe Blogs
     *  - 'oauth' - Uses open authorisation to authenticate users.
     */
    authentication: {
      kind: AuthenticationKindKeys
    }

    /** Authorisation label
     *  - 'basic' - Usual checks on access apply
     */
    authorisation: {
      kind: AuthorisationKindKeys
    }

    /** Audit label
     *  - 'silly' - No events are tracked
     *  - 'stdout' - Events are streamed via standard output
     */
    audit: {
      kind: AuditKindKeys
    }
    /** File scanners
     *  Information specific to how Bailo connects with the file scanners
     */
    fileScanners: {
      /** List of file scanners to use. */
      kinds: FileScanKindKeys[]
      /** Normal retry connection time */
      retryDelayInMinutes: number
      /** Max retries to connect scanners */
      maxInitRetries: number
      /** Initial delay for startup */
      initRetryDelay: number
    }
  }

  /** ### Federation
   *
   * Allows Bailo to search models on other peers
   *
   */
  federation: {
    /** Status of federation search
     * - 'enabled' - Creates peer connections
     * - 'readOnly' - Used for creating a peer itself without any peers
     * - 'disabled' - Doesn't create peer connections
     */
    state: FederationStateKeys
    /** Unique identifier to be sent in response on peer request*/
    id: string

    /** ### Peers
     *
     * Either Bailo or Hugging face peers that Bailo can search on.
     *  peer list of bailo or Huggingface instances.
     */
    peers: { [key: string]: RemoteFederationConfig }
  }

  /** ### Simple Mail Transfer Protocol
   *
   * Emails will be sent with each access request and
   *
   */
  smtp: {
    /** Use emails */
    enabled: boolean
    /** Send emails using AWS or otherwise */
    transporter: TransportOption

    /** Connection
     *
     * Connection information for an SMTP server.  Settings are passed directly to 'node-mailer', see reference for options:
     * */
    // [https://nodemailer.com/smtp/#1-single-connection](https://nodemailer.com/smtp/#1-single-connection)
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
    /** Set the email address that Bailo should use, can be different from the SMTP server details. */
    from: string
  }

  ses: {
    endpoint: string
    /** AWS region */
    region: string
  }

  /** ### Logging middleware
   *
   * Bunyan logs for debugging observability
   */
  log: {
    /** Bunyan log level to display. Either: "trace", "debug", "info", "warn", "error" or "fatal" */
    level: bunyan.LogLevel
  }

  /** ### S3
   *
   * Defines storage behavior. Used for all artifacts including:
   * - registry artifacts
   * - files
   */
  s3: {
    /** Object store credentials. Do not store in plaintext */
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

    automaticallyCreateBuckets: boolean
    /** Chunk size for uploading files via multipart upload */
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
  /** A mongo connection URI, can contain replica set information, etc.
     * See: [https://www.mongodb.com/docs/manual/reference/connection-string/]

     * This is usually embedded in a config map, so do not put usernames and
     * passwords in the connection string. */
  mongo: {
    /** A mongo connection URI, can contain replica set information, etc.
     * See: [https://www.mongodb.com/docs/manual/reference/connection-string/]

     * This is usually embedded in a config map, so do not put usernames and
     * passwords in the connection string. */
    uri: string

    /** Override for URI if using secrets in production */
    user: string
    /** Mongo password to be compiled on build  */
    pass: string

    /** Whether to use transactions. Requires a replica set to be enabled */
    transactions: boolean
  }

  /** Information required to set up the registry in token mode */
  registry: {
    /** ### Registry Connection
     *
     * Defines service information about the registry
     */
    connection: {
      /** URI for the registry endpoint */
      internal: string
      /** Allow communication with an insecure registry (with self signed certificates) */
      insecure: boolean
    }

    /** The registry audience */
    service: string
    /** The registry issuer */
    issuer: string
    /** @deprecated Redundant with connection.insecure */
    insecure: boolean
  }
  /** ### UI Configuration
   *
   * Some features on the UI are dynamic and customisable.
   *
   * The UI object contains all information that is user facing.
   *
   */
  ui: UiConfig

  /** ### Session
   *
   * Secret used to sign express-sessions should be difficult to parse by a human
   *
   * Should be rotated as best practice
   */
  session: {
    /** Secret for signing express sessions for authentication */
    secret: string
  }

  /** ### Open Authorisation
   *
   * Defines behaviour for user authorisation if the connector is enabled
   */
  oauth: {
    /** Redirect for the login to set a session cookie */
    provider: string
    /** Grant configuration options, provide any option from:
     * [https://www.npmjs.com/package/grant] */
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
   * eg. require('../src/scripts/example_schemas/minimal_model_schema.json')
   *
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

  /** ### Antivirus Scanning
   *
   * Antivirus scanning for files within models.
   *
   * Scanners operate a priority queue
   */
  avScanning: {
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

    /** ### Model Scan
     *
     * Model scan is an open source tool to scan specifically on models
     *
     * [Read on Github](https://github.com/protectai/modelscan)
     *
     * [Bailo RESTAPI](../../../lib/modelscan_api/README.md)
     *
     */
    modelscan: {
      /** Number of files scanned at one time */
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
    /** Shared authorisation secret */
    authorisationToken: string
  }
}

const config: Config = _config.util.toObject()
export default deepFreeze(config) as Config
