import { StepNoRender } from 'types/types'
import { getFormStats } from 'utils/formUtils'
import { expect } from 'vitest'

/**
 * // Example Business Case form where 3 questions are shown with 3 answers
 */
test('getFormStats should calculate stats for a fully completed mixed form', () => {
  const step: StepNoRender = {
    schema: undefined,
    state: {
      necessityAndProportionality: 'It is needed',
      applicableStatutoryFunction: ['EWB'],
      OPs: 'Because we need it now',
    },
    index: 0,
    steps: [],
    type: 'Form',
    section: 'First Page',
    schemaRef: 'abc',
    shouldValidate: false,
    isComplete: () => false,
    uiSchema: {
      confidenceStatement: {
        'ui:widget': 'textarea',
      },
      datasets: {
        'ui:widget': 'dataCardSelector',
      },
      performanceSummary: {
        'ui:widget': 'textarea',
      },
      riskAssessment: {
        'ui:widget': 'textarea',
      },
      summary: {
        'ui:widget': 'textarea',
      },
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(3)
  expect(stats.totalAnswers).toBe(3)
  expect(stats.percentageQuestionsComplete).toBe(100)
  expect(stats.formCompleted).toBe(true)
})

/**
 * // Example Overview form where 5 questions are shown with 0 answers given
 */
test('getFormStats should calculate stats for an empty mixed form', () => {
  const step: StepNoRender = {
    schema: undefined,
    state: {},
    index: 0,
    steps: [],
    type: 'Form',
    section: 'First Page',
    schemaRef: 'abc',
    shouldValidate: false,
    isComplete: () => false,
    uiSchema: {
      confidenceStatement: {
        'ui:widget': 'textarea',
      },
      datasets: {
        'ui:widget': 'dataCardSelector',
      },
      performanceSummary: {
        'ui:widget': 'textarea',
      },
      riskAssessment: {
        'ui:widget': 'textarea',
      },
      summary: {
        'ui:widget': 'textarea',
      },
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(5)
  expect(stats.totalAnswers).toBe(0)
  expect(stats.percentageQuestionsComplete).toBe(0)
  expect(stats.formCompleted).toBe(false)
})

/**
 * Example Overview form where 2 questions are shown with 2 answers
 * given and 2 metrics are given
 */
test('getFormStats should calculate stats for a fully completed mixed form and ignore metrics', () => {
  const step: StepNoRender = {
    schema: undefined,
    state: {
      modelSummary: 'bobby',
      metrics: [
        {
          name: 'cats',
          value: 3,
        },
        {
          name: 'dogs',
          value: 5,
        },
      ],
    },
    index: 0,
    steps: [],
    type: 'Form',
    section: 'First Page',
    schemaRef: 'abc',
    shouldValidate: false,
    isComplete: () => false,
    uiSchema: {
      modelSummary: {
        'ui:widget': 'textarea',
      },
      datasets: {
        'ui:widget': 'dataCardSelector',
      },
      metrics: {
        'ui:widget': 'metricsWidget',
        items: {
          name: {},
          value: {},
        },
      },
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(2)
  expect(stats.totalAnswers).toBe(1)
  expect(stats.percentageQuestionsComplete).toBe(50)
  expect(stats.formCompleted).toBe(false)
})
