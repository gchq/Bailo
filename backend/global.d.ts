declare module 'dev-null'

declare namespace Express {
  interface Request {
    user: UserDoc

    reqId: string
    log: Logger

    session: {
      grant: any
    }
  }

  interface Response {
    error: (code: number, error: any) => void
  }
}
