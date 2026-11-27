module.exports = {
  api: {
    // A single NGINX hop sits in front of the backend
    trustProxy: 1,
  },
  s3: {
    credentials: {
      accessKeyId: 'bailoadmin',
      secretAccessKey: 'bailoadmin',
    },
    endpoint: 'http://localhost:8333',
  },
}
