declare module 'dev-null'

type callback = (err: string | undefined) => void

declare namespace Express {
  interface Request {
    user: UserInterface

    audit: { typeId: string; description: string; auditKind: string; resourceKind: string }

    reqId: string
    log: Logger

    session: {
      destroy: (callback) => void
      grant: any
    }
  }

  interface Response {
    error: (code: number, error: unknown) => void
  }
}
