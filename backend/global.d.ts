declare module 'dev-null'

declare namespace Express {
  interface Request {
    user: UserDoc

    reqId: string
    log: Logger

    session: {
      destroy: Function
      grant: any
    }
  }

  interface Response {
    error: (code: number, error: any) => void
  }
}
