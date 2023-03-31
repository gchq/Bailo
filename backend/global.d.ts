declare module 'dev-null'

declare namespace Express {
  interface Request {
    user: UserDoc

    reqId: string
    log: Logger
  }

  interface Response {
    error: (code: number, error: any) => void
  }
}
