import { CreateBucketCommand, GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
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
            endpoint: process.env.S3_A_ENDPOINT ?? 'http://localhost:8333',
            region: 'ignored',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY ?? 'bailoadmin',
              secretAccessKey: process.env.S3_SECRET_KEY ?? 'bailoadmin',
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
        async waitForS3Object(key: string) {
          const s3 = new S3Client({
            endpoint: process.env.S3_A_ENDPOINT ?? 'http://localhost:8333',
            region: 'ignored',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY ?? 'bailoadmin',
              secretAccessKey: process.env.S3_SECRET_KEY ?? 'bailoadmin',
            },
          })
          for (let i = 0; i < 30; i++) {
            try {
              await s3.send(new HeadObjectCommand({ Bucket: 'exports', Key: key }))
              return null
            } catch {
              await new Promise((r) => setTimeout(r, 1000))
            }
          }
          throw new Error(`Timed out waiting for s3://exports/${key}`)
        },
        async getSignedUrl(key: string) {
          const s3 = new S3Client({
            endpoint: process.env.S3_A_ENDPOINT ?? 'http://s3-a:8333',
            region: 'ignored',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY ?? 'bailoadmin',
              secretAccessKey: process.env.S3_SECRET_KEY ?? 'bailoadmin',
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
