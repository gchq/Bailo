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
{{ include "bailo.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "bailo.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bailo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "bailo.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "bailo.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "bailo.mongo.host" -}}
{{- if .Values.mongodb.enabled -}}
{{ include "bailo.fullname" . }}-mongodb.{{ .Release.Namespace }}.svc.cluster.local
{{- else -}}
{{ .Values.mongodb.host }}
{{- end -}}
{{- end -}}


{{/*
Create the mongo connection URI
*/}}
{{- define "bailo.mongoConnectionURI" -}}
mongodb://bailo_user:${MONGO_PASSWORD}@{{ include "bailo.mongo.host" . }}:{{ .Values.mongodb.service.port }}/{{ .Values.mongodb.collectionName }}
{{- end }}

{{- define "bailo.minio.host" -}}
{{- if .Values.minio.enabled -}}
{{ include "bailo.fullname" . }}-minio
{{- else -}}
{{ .Values.minio.host }}
{{- end -}}
{{- end -}}
