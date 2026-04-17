{{/*
Expand the name of the chart.
*/}}
{{- define "bailo.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "bailo.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "bailo.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "bailo.labels" -}}
helm.sh/chart: {{ include "bailo.chart" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/name: {{ include "bailo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Mongo host definition
*/}}
{{- define "bailo.mongo.host" -}}
{{- if and (.Values.mongodb.enabled) (eq .Values.mongodb.architecture "standalone") -}}
{{ include "bailo.fullname" . }}-mongodb:{{ .Values.mongodb.service.port }}/{{ .Values.mongodb.collectionName }}
{{- else if and (.Values.mongodb.enabled) (eq .Values.mongodb.architecture "replicaset") -}}
{{ include "bailo.fullname" . }}-mongodb-headless:{{ .Values.mongodb.service.port }}/{{ .Values.mongodb.collectionName }}
{{- else -}}
{{ .Values.mongodb.host }}
{{- end -}}
{{- end -}}

{{/*
Create the mongo connection URI
*/}}
{{- define "bailo.mongoConnectionURI" -}}
mongodb://{{ include "bailo.mongo.host" . }}
{{- end }}

{{/*
Mail host definition
*/}}
{{- define "bailo.mail.host" -}}
{{- if .Values.mail.enabled -}}
{{ include "bailo.fullname" . }}-mail
{{- else -}}
{{ .Values.config.smtp.host }}
{{- end -}}
{{- end -}}

{{/*
Minio host definition
*/}}
{{- define "bailo.minio.host" -}}
{{- if .Values.minio.enabled -}}
{{ include "bailo.fullname" . }}-minio
{{- else -}}
{{ .Values.minio.host }}
{{- end -}}
{{- end -}}

{{/*
Registry host definition
*/}}
{{- define "bailo.registry.host" -}}
{{- if .Values.registry.enabled -}}
{{ include "bailo.fullname" . }}-registry
{{- else -}}
{{ .Values.registry.host }}
{{- end -}}
{{- end -}}

{{- define "environment-config" -}}
inference:
  authorisationToken: INFERENCING_WRITE_TOKEN
instrumentation:
  authenticationToken: OTEL_EXPORTER_TOKEN
modelMirror:
  export:
    kmsSignature:
      KMSClient:
        credentials:
          accessKeyId: KMS_ACCESS_KEY
          secretAccessKey: KMS_SECRET_KEY
mongo:
  pass: MONGO_PASSWORD
s3:
  credentials:
    accessKeyId: MINIO_ACCESS_KEY
    secretAccessKey: MINIO_SECRET_KEY
{{- end -}}

{{- define "production-config" -}}
api:
  port: {{ .Values.service.backendPort }}
app:
  protocol: {{ .Values.config.app.protocol }}
  host: {{ .Values.route.appPublicRoute }}
  port: {{ .Values.config.app.port }}
  privateKey: /app/certs/key.pem
  publicKey: /app/certs/cert.pem
mongo:
  uri: {{ include "bailo.mongoConnectionURI" . }}
  user: {{ index .Values.mongodb.auth.usernames 0 }}
  connectionOptions:
    useFindAndModify: false
    useNewUrlParser: true
    useUnifiedTopology: true
    useCreateIndex: true
    ssl: {{ .Values.mongodb.ssl }}
    sslValidate: {{ .Values.mongodb.sslValidate }}
registry:
  connection:
    internal: https://{{ include "bailo.registry.host" . }}:{{ .Values.registry.port }}
    host: {{ include "bailo.registry.host" . }}:{{ .Values.registry.port }}
    port: {{ .Values.registry.port }}
    protocol: {{ .Values.registry.protocol }}
    insecure: {{ .Values.registry.insecure }}
  service: RegistryAuth
  issuer: RegistryIssuer
  insecure: {{ .Values.registry.insecure }}
federation:
  state: {{ .Values.federation.state }}
  {{ if eq .Values.federation.state "enabled" }}
  id: {{ .Values.federation.id }}
  peers:
  {{ range $v := .Values.federation.peers }}
    {{ $v.name }}:
      state: {{ $v.state }}
      baseUrl: {{ $v.baseUrl }}
      label: {{ $v.label }}
      kind: {{ $v.kind }}
      cache:
        query: {{ $v.cacheQuery }}
      extra:
        statusModelName: {{ $v.statusModelName }}
        statusModelId: {{ $v.statusModelId }}
  {{ end }}
  {{ end }}
artefactScanning:
  clamdscan:
    concurrency: {{ .Values.clamav.concurrency }}
    host: {{ include "bailo.fullname" . }}-clamav
    port: {{ .Values.clamav.port }}
  artefactscan:
    concurrency: {{ .Values.artefactscan.concurrency }}
    host: {{ include "bailo.fullname" . }}-artefactscan
    port: {{ .Values.artefactscan.port }}
    protocol: "{{ .Values.artefactscan.protocol }}"
smtp:
  enabled: true
  transporter: {{ .Values.config.smtp.transporter }}
  connection:
    host: {{ include "bailo.mail.host" . }}
    port: {{ .Values.config.smtp.port }}
    secure: {{ .Values.config.smtp.secure }}
    auth:
      user: {{ .Values.config.smtp.user }}
      pass: {{ .Values.config.smtp.pass }}
    tls:
      rejectUnauthorized: {{ .Values.config.smtp.rejectUnauthorized }}
  from: {{ .Values.config.smtp.from }}
log:
  level: {{ .Values.config.log.level }}
session:
  secret: {{ .Values.cookie.secret }}
oauth:
  provider: cognito
  grant:
    defaults:
      origin: {{ .Values.oauth.origin }}
    cognito:
      key: {{ .Values.oauth.cognito.key }}
      secret: {{ .Values.oauth.cognito.secret }}
      dynamic: {{ .Values.oauth.cognito.dynamic }}
      response: {{ .Values.oauth.cognito.response }}
      callback: {{ .Values.oauth.cognito.callback }}
      subdomain: {{ .Values.oauth.cognito.subdomain }}
  cognito:
    identityProviderClient:
      region: eu-west-2
      credentials:
        accessKeyId: {{ .Values.oauth.identityProviderClient.accessKeyId }}
        secretAccessKey: {{ .Values.oauth.identityProviderClient.secretAccessKey }}
    userPoolId: {{ .Values.oauth.identityProviderClient.userPoolId }}
    userIdAttribute: {{ .Values.oauth.identityProviderClient.userIdAttribute }}
    adminGroupName: {{ .Values.oauth.cognito.adminGroupName }}
ui:
  banner:
    enabled: {{ .Values.config.ui.banner.enabled }}
    text: {{ .Values.config.ui.banner.text }}
    colour: {{ .Values.config.ui.banner.colour }}
    textColor: {{ .Values.config.ui.banner.textColor}}
  announcement:
    enabled: {{ .Values.config.ui.announcement.enabled }}
    text: {{ .Values.config.ui.announcement.text }}
    startTimestamp: {{ .Values.config.ui.announcement.startTimestamp }}
  issues:
    label: Bailo Support Team
    supportHref: {{ .Values.config.issueLinks.support }}
    contactHref: {{ .Values.config.issueLinks.contact }}
  registry:
    host: {{ .Values.route.appPublicRoute }}
  inference:
    enabled: {{ .Values.inference.enabled}}
    connection:
      host: {{ .Values.inference.host}}
    gpus: {{ .Values.inference.gpus }}
    authorizationTokenName: {{ .Values.inference.authorizationTokenName }}
  modelMirror:
    import:
      enabled: {{ .Values.modelMirror.import.enabled }}
      additionalInfoHeading: {{ .Values.modelMirror.import.additionalInfoHeading }}
      originalAnswerHeading: {{ .Values.modelMirror.import.originalAnswerHeading }}
    export:
      enabled: {{ .Values.modelMirror.export.enabled }}
      disclaimer: {{ .Values.modelMirror.export.disclaimer }}
  helpPopoverText:
    manualEntryAccess: {{ .Values.config.ui.helpPopoverText.manualEntryAccess }}
  modelDetails:
    organisations: {{ toJson .Values.config.ui.modelDetails.organisations }}
    states: {{ toJson .Values.config.ui.modelDetails.states }}
  roleDisplayNames:
    owner: {{ .Values.config.ui.roleDisplayNames.owner }}
    consumer: {{ .Values.config.ui.roleDisplayNames.consumer }}
    contributor: {{ .Values.config.ui.roleDisplayNames.contributor }}
connectors:
  authentication:
    kind: {{ .Values.connectors.authentication.kind }}
  authorisation:
    kind: {{ .Values.connectors.authorisation.kind }}
  audit:
    kind: {{ .Values.connectors.audit.kind }}
  artefactScanners:
    kinds: {{ toJson .Values.connectors.artefactScanners.kinds }}
    retryDelayInMinutes: {{ .Values.connectors.artefactScanners.retryDelayInMinutes }}
    maxInitRetries:  {{ .Values.connectors.artefactScanners.maxInitRetries }}
    initRetryDelay: {{ .Values.connectors.artefactScanners.initRetryDelay }}
instrumentation:
  enabled: {{ .Values.instrumentation.enabled }}
  endpoint: {{ .Values.instrumentation.endpoint }}
  debug: {{ .Values.instrumentation.debug }}
ses:
  endpoint: {{ .Values.aws.ses.endpoint }}
  region: {{ .Values.aws.ses.region }}
s3:
  endpoint: {{ ternary "https" "http" (eq .Values.minio.useSSL true)}}://{{ include "bailo.minio.host" . }}:{{ .Values.minio.service.ports.api }}
  region: {{ .Values.minio.region }}
  forcePathStyle: true
  buckets:
    uploads: {{ .Values.minio.uploadBucket }}
    registry: {{ .Values.minio.registryBucket }}
modelMirror:
  export:
    bucket: {{ .Values.modelMirror.export.bucket }}
    concurrency: {{ .Values.modelMirror.export.concurrency }}
    kmsSignature:
      KMSClient:
        region: {{ .Values.modelMirror.export.kmsSignature.KMSClient.region }}
      enabled: {{ .Values.modelMirror.export.kmsSignature.enabled }}
      keyId: {{ .Values.modelMirror.export.kmsSignature.keyId }}
stroom:
  logOnlyMode: {{ .Values.stroom.logOnlyMode }}
  feed: {{ .Values.stroom.feed }}
  url: {{ .Values.stroom.url }}
  environment: {{ .Values.stroom.environment }}
  interval: {{ .Values.stroom.interval }}
  generator: {{ .Values.stroom.generator }}
  rejectUnauthorized: {{ .Values.stroom.rejectUnauthorized }}
{{- end -}}