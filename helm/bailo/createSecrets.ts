import { exec } from 'shelljs'
import { v4 as uuidv4 } from 'uuid'

const prefix = 'bailo'

export default async function createSecrets() {
  // minio secrets
  const rootUser = uuidv4()
  const rootPassword = uuidv4()

  exec(`kubectl create secret generic ${prefix}-minio \
    --from-literal=root-user='${rootUser}' \
    --from-literal=root-password='${rootPassword}'
  `)

  // mongo secrets
  const mongodbPassword = uuidv4()
  const mongodbRootPassword = uuidv4()
  const mongodbReplicaSetKey = uuidv4()

  exec(`kubectl create secret generic ${prefix}-mongodb \
    --from-literal=mongodb-passwords='${mongodbPassword}' \
    --from-literal=mongodb-root-password='${mongodbRootPassword}' \
    --from-literal=mongodb-replica-set-key='${mongodbReplicaSetKey}'
  `)

  // redis secrets
  const redisPassword = uuidv4()

  exec(`kubectl create secret generic ${prefix}-redis \
    --from-literal=redis-password='${redisPassword}'
  `)
}

createSecrets()
