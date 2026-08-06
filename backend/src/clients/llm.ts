import fetch, { Response } from 'node-fetch'

import log from '../services/log.js'
import config from '../utils/config.js'
import { ConfigurationError, InternalError } from '../utils/error.js'

export enum ChatMessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface ChatMessage {
  role: ChatMessageRole
  content: string
}

export async function callLlmChatCompletion(messages: ChatMessage[]): Promise<string> {
  if (!config.ui.llmImport.enabled) {
    throw ConfigurationError('LLM integration is not enabled.')
  }

  if (!config.llm.endpoint || !config.llm.model) {
    throw ConfigurationError('LLM endpoint and model must be configured.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.llm.timeoutMs)

  let res: Response
  try {
    res = await fetch(config.llm.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.llm.apiKey && { Authorization: `Bearer ${config.llm.apiKey}` }),
      },
      body: JSON.stringify({
        model: config.llm.model,
        messages,
        max_tokens: config.llm.maxTokens,
        temperature: config.llm.temperature,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal as AbortSignal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw InternalError('LLM request timed out.', { timeoutMs: config.llm.timeoutMs })
    }
    throw InternalError('Unable to communicate with the LLM service.', { err })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => 'Unable to read response body')
    log.error({ statusCode: res.status, body }, 'LLM service returned an error response.')
    throw InternalError('LLM service returned an error response.', { statusCode: res.status })
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw InternalError('LLM service returned an empty response.')
  }

  return content
}
