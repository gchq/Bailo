import { getErrorMessage } from 'utils/fetcher'
import { describe, expect, it } from 'vitest'

function errorResponse(body: unknown) {
  return { status: 400, json: async () => body } as Response
}

describe('getErrorMessage', () => {
  it('lists the schema validation failures reported by the backend', async () => {
    const message = await getErrorMessage(
      errorResponse({
        error: {
          message: 'Deployment assessment metadata could not be validated against the schema.',
          context: {
            errors: [
              {
                path: ['about', 'deploymentSummary'],
                message: 'does not meet maximum length of 5000',
                schema: { title: 'What does the deployment do?' },
              },
            ],
          },
        },
      }),
    )

    expect(message).toBe(
      'Bad Request: Deployment assessment metadata could not be validated against the schema.\n' +
        'What does the deployment do?: does not meet maximum length of 5000',
    )
  })

  it('returns just the message when there are no validation failures', async () => {
    const message = await getErrorMessage(errorResponse({ error: { message: 'Something went wrong' } }))

    expect(message).toBe('Bad Request: Something went wrong')
  })
})
