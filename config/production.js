module.exports = {
  // explicitly remove default passwords in production
  minio: {
    accessKey: '',
    secretKey: '',
  },

  smtp: {
    auth: {
      user: '',
      pass: '',
    },
    tls: {
      rejectUnauthorized: true,
    },
  },
}
