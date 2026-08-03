import { CreateBucketCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:8080',

    specPattern: ['cypress/e2e/bailo/**/*.cy.{js,jsx,ts,tsx}', 'cypress/e2e/cross-instance/**/*.cy.{js,jsx,ts,tsx}'],
    expose: {
      instanceAUrl: process.env.CYPRESS_INSTANCE_A_URL ?? 'http://localhost:8081',
      instanceBUrl: process.env.CYPRESS_INSTANCE_B_URL ?? 'http://localhost:8082',
    },

    defaultCommandTimeout: 10000,
    video: false,
    setupNodeEvents(on) {
      on('task', {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message)

          return null
        },
        table(message) {
          // eslint-disable-next-line no-console
          console.table(message)

          return null
        },
        async ensureExportsBucket() {
          const s3 = new S3Client({
            endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
            region: 'ignored',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
              secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
            },
          })
          try {
            await s3.send(new CreateBucketCommand({ Bucket: 'exports' }))
          } catch (err: unknown) {
            if (Error.isError(err) && err?.name !== 'BucketAlreadyOwnedByYou' && err?.name !== 'BucketAlreadyExists') {
              throw err
            }
          }
          return null
        },
        async getSignedUrl(key: string) {
          const s3 = new S3Client({
            endpoint: process.env.MINIO_ENDPOINT ?? 'http://minio-a:9000',
            region: 'ignored',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
              secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
            },
          })
          return await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket: 'exports',
              Key: key,
            }),
            { expiresIn: 3600 },
          )
        },
      })
    },
  },
})
