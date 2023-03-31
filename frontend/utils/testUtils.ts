import { NextRouter } from 'next/router'

export const doNothing = () => undefined

const useRouter = jest.spyOn(require('next/router'), 'useRouter')

export function mockNextUseRouter({ pathname }: Pick<NextRouter, 'pathname'>) {
  useRouter.mockImplementation(() => ({
    pathname,
    prefetch: doNothing,
  }))
}
