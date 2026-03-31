import { StepNoRender } from 'types/types'
import { getFormStats, getOverallCompletionStats } from 'utils/formUtils'
import { expect } from 'vitest'

const stepExample: StepNoRender = {
  schema: undefined,
  state: {},
  index: 0,
  steps: [],
  type: 'Form',
  section: 'First Page',
  schemaRef: 'abc',
  shouldValidate: false,
  isComplete: () => false,
  uiSchema: {},
}

test('getFormStats should calculate stats for a fully completed mixed form', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Business Case',
      description: 'The business case section is designed for a non-technical customer of a model to understand.',
      type: 'object',
      properties: {
        need: {
          title: 'Need for creating the model',
          description: 'Detailed description.',
          type: 'string',
          maxLength: 10000,
        },
        function: {
          title: 'Applicable statutory function',
          type: 'array',
          widget: 'multiSelector',
          items: {
            type: 'string',
            enum: ['SHOE', 'HAT', 'SOCK', 'Not applicable'],
          },
          uniqueItems: true,
        },
        extraInfo: {
          title: 'Extra Information',
          description: 'List extra information',
          type: 'string',
          maxLength: 10000,
        },
      },
      additionalProperties: false,
    },
    state: {
      need: 'It is needed',
      function: ['SHOE'],
      extraInfo: 'Because we need it now',
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(2)
  expect(stats.totalAnswers).toBe(3)
  expect(stats.percentageQuestionsComplete).toBe(100)
  expect(stats.formCompleted).toBe(true)
})

test('getFormStats should calculate stats for an empty mixed form', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Overview',
      description: 'The overview section is designed for a non-technical customer of the model to understand.',
      type: 'object',
      properties: {
        summary: {
          title: 'Summary of the model',
          description:
            'This short summary should be designed for a non-technical user to understand the purpose and high-level architectural details of the model.',
          type: 'string',
          maxLength: 10000,
        },
        performanceSummary: {
          title: 'Summary of performance',
          description:
            'Summarise the performance metrics and any performance limitations of the model. Include any output confidence statement that must be presented to the end user.',
          type: 'string',
          maxLength: 10000,
        },
        riskAssessment: {
          title: 'Summary of risk assessment',
          description: 'Summarise the operational limitations.',
          type: 'string',
          maxLength: 10000,
        },
        confidenceStatement: {
          title: 'Confidence statement of output for users',
          description:
            'Give handling caveats and confidence ratings that should be presented to the end user, including decision eights and automated decision-making considerations if applicable.',
          type: 'string',
          maxLength: 10000,
        },
        datasets: {
          title: 'If there are any datasets related to this model please list them',
          type: 'array',
          widget: 'dataCardSelector',
          items: {
            type: 'string',
          },
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
    state: {},
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(4)
  expect(stats.totalAnswers).toBe(0)
  expect(stats.percentageQuestionsComplete).toBe(0)
  expect(stats.formCompleted).toBe(false)
})

test('getFormStats should calculate stats for a fully completed mixed form and ignore metrics', () => {
  const step = {
    ...stepExample,
    schema: {
      title: 'Overview',
      description: 'Summary of the model functionality.',
      type: 'object',
      properties: {
        modelSummary: {
          title: 'What does the model do?',
          description: 'A description of what the model does.',
          type: 'string',
          minLength: 1,
          maxLength: 5000,
        },
        datasets: {
          title: 'Are there any datasets related to this model?',
          type: 'array',
          widget: 'dataCardSelector',
          items: {
            type: 'string',
          },
          uniqueItems: true,
        },
        metrics: {
          type: 'array',
          title: 'Metrics',
          widget: 'metricsWidget',
          items: {
            type: 'object',
            title: '',
            properties: {
              name: {
                title: 'Metric name',
                type: 'string',
              },
              value: {
                title: 'Model performance metric value',
                type: 'number',
              },
            },
          },
        },
      },
      required: [],
      additionalProperties: false,
    },
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
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(1)
  expect(stats.totalAnswers).toBe(1)
  expect(stats.percentageQuestionsComplete).toBe(100)
  expect(stats.formCompleted).toBe(true)
})

test('getFormStats should calculate stats for an empty single section form with with deep nesting', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Training Datasets',
      description: 'Descriptions of the data used to train or test the model and any handling restrictions.',
      type: 'object',
      properties: {
        dataset: {
          title: ' ',
          type: 'array',
          minItems: 1,
          items: {
            title: 'Dataset',
            type: 'object',
            properties: {
              name: {
                title: 'Name or Reference Number of the training data',
                description: 'Please provide the name of the training data used.',
                type: 'string',
              },
              owner: {
                title: 'Dataset owner',
                description: 'Dataset owner or responsible team.',
                type: 'string',
                maxLength: 100,
              },
              description: {
                title: 'Data description',
                description: 'A detailed description of the data used',
                type: 'string',
                maxLength: 10000,
              },
              isFullDatasetUsed: {
                title: 'If the full dataset is not used, describe how the subset used was selected',
                type: 'string',
                maxLength: 10000,
              },
              origin: {
                title: 'What is the source of the dataset?',
                description: 'Select all that apply.',
                type: 'array',
                widget: 'multiSelector',
                items: {
                  type: 'string',
                  enum: ['Internal', 'Supermarket', 'University', 'Commercial', 'Academic', 'Open Source', 'Other'],
                },
                uniqueItems: true,
              },
              originDetail: {
                title: 'Please provide any additional information about the datasets origin',
                type: 'string',
                maxLength: 10000,
              },
              location: {
                title: 'Location of dataset',
                type: 'string',
              },
              requirement: {
                title: 'Requirement',
                $ref: '#/definitions/output',
              },
              licenceDetails: {
                title: 'Details of licences including end dates',
                type: 'string',
                maxLength: 10000,
              },
              useDetails: {
                title: 'If details are required for how it should be used',
                type: 'string',
                maxLength: 10000,
              },
              considerations: {
                title: 'Risks, limitations.',
                description: 'Detail known or suspected concerns. State any mitigations applied.',
                type: 'string',
                maxLength: 10000,
              },
              anonymisedOrPseudonymised: {
                title: 'If the data is anonymised then please provide details',
                type: 'string',
                maxLength: 10000,
              },
              retentionDate: {
                title: 'Date reviewed for retention',
                description: 'Training Data must be reviewed once yearly.',
                type: 'string',
                format: 'date',
              },
              nextReview: {
                title: 'Date of next review',
                type: 'string',
                format: 'date',
              },
              supportEndDate: {
                title: 'Date that the data is no longer required for model support',
                type: 'string',
                format: 'date',
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    state: {
      dataset: [{}],
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(14)
  expect(stats.totalAnswers).toBe(0)
  expect(stats.percentageQuestionsComplete).toBe(0)
  expect(stats.formCompleted).toBe(false)
})

test('getFormStats should calculate stats for a partially completed section form with deep nesting', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Training Datasets',
      description: 'Descriptions of the data used to train or test the model and any handling restrictions.',
      type: 'object',
      properties: {
        dataset: {
          title: ' ',
          type: 'array',
          minItems: 1,
          items: {
            title: 'Dataset',
            type: 'object',
            properties: {
              name: {
                title: 'Name or Reference Number of the training data',
                description: 'Please provide the name of the training data used.',
                type: 'string',
              },
              owner: {
                title: 'Dataset owner',
                description: 'Dataset owner or responsible team.',
                type: 'string',
                maxLength: 100,
              },
              description: {
                title: 'Data description',
                description: 'A detailed description of the data used',
                type: 'string',
                maxLength: 10000,
              },
              isFullDatasetUsed: {
                title: 'If the full dataset is not used, describe how the subset used was selected',
                type: 'string',
                maxLength: 10000,
              },
              origin: {
                title: 'What is the source of the dataset?',
                description: 'Select all that apply.',
                type: 'array',
                widget: 'multiSelector',
                items: {
                  type: 'string',
                  enum: ['Internal', 'Supermarket', 'University', 'Commercial', 'Academic', 'Open Source', 'Other'],
                },
                uniqueItems: true,
              },
              originDetail: {
                title: 'Please provide any additional information about the datasets origin',
                type: 'string',
                maxLength: 10000,
              },
              location: {
                title: 'Location of dataset',
                type: 'string',
              },
              requirement: {
                title: 'Requirement',
                $ref: '#/definitions/output',
              },
              licenceDetails: {
                title: 'Details of licences including end dates',
                type: 'string',
                maxLength: 10000,
              },
              useDetails: {
                title: 'If details are required for how it should be used',
                type: 'string',
                maxLength: 10000,
              },
              considerations: {
                title: 'Risks, limitations, bias and ethical considerations',
                description: 'Detail known or suspected concerns. State any mitigations applied.',
                type: 'string',
                maxLength: 10000,
              },
              anonymisedOrPseudonymised: {
                title: 'If the data is anonymised/pseudonymised then please provide details',
                type: 'string',
                maxLength: 10000,
              },
              retentionDate: {
                title: 'Date reviewed for retention',
                description: 'Training Data must be reviewed once yearly.',
                type: 'string',
                format: 'date',
              },
              nextReview: {
                title: 'Date of next review',
                type: 'string',
                format: 'date',
              },
              supportEndDate: {
                title: 'Date that the data is no longer required for model support',
                type: 'string',
                format: 'date',
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    state: {
      dataset: [
        {
          name: 'bobby',
          description: 'bob',
          requirement: 'DOG',
          considerations: 'bob',
          retentionDate: '2027-12-12',
        },
      ],
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(14)
  expect(stats.totalAnswers).toBe(5)
  expect(stats.percentageQuestionsComplete).toBe(35.7)
  expect(stats.formCompleted).toBe(false)
})

test('getFormStats should calculate stats for a partially completed section form with nested sections', () => {
  const step = {
    ...stepExample,
    schema: {
      title: 'Another Page',
      description: 'This is a second page',
      type: 'object',
      properties: {
        sectionOne: {
          title: 'Section one',
          description: 'This is a section',
          type: 'object',
          properties: {
            q1: {
              title: 'Question one',
              description: 'This is a question',
              type: 'string',
            },
            q2: {
              title: 'Question two',
              description: 'This is a question',
              type: 'string',
            },
            q3: {
              title: 'Question three',
              description: 'This is a date question',
              type: 'string',
              format: 'date',
            },
          },
        },
        sectionTwo: {
          title: 'Section two',
          description: 'This is another section',
          type: 'object',
          properties: {
            questionThree: {
              title: 'Question three',
              description: 'This is number question',
              type: 'number',
            },
            questionFour: {
              title: 'Question four',
              description: 'This is a checkbox question',
              type: 'boolean',
            },
          },
        },
      },
      required: [],
      additionalProperties: false,
    },
    state: {
      sectionOne: {
        q2: 'bob',
        q3: '2031-04-23',
      },
      sectionTwo: {
        questionFour: true,
      },
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(5)
  expect(stats.totalAnswers).toBe(3)
  expect(stats.percentageQuestionsComplete).toBe(60)
  expect(stats.formCompleted).toBe(false)
})

test('getFormStats should calculate stats for an incomplete form with nested sections', () => {
  const step = {
    ...stepExample,
    schema: {
      title: 'Another Page',
      description: 'This is a second page',
      type: 'object',
      properties: {
        sectionOne: {
          title: 'Section one',
          description: 'This is a section',
          type: 'object',
          properties: {
            q1: {
              title: 'Question one',
              description: 'This is a question',
              type: 'string',
            },
            q2: {
              title: 'Question two',
              description: 'This is a question',
              type: 'string',
            },
            q3: {
              title: 'Question three',
              description: 'This is a date question',
              type: 'string',
              format: 'date',
            },
          },
        },
        sectionTwo: {
          title: 'Section two',
          description: 'This is another section',
          type: 'object',
          properties: {
            questionThree: {
              title: 'Question three',
              description: 'This is number question',
              type: 'number',
            },
            questionFour: {
              title: 'Question four',
              description: 'This is a checkbox question',
              type: 'boolean',
            },
          },
        },
      },
      required: [],
      additionalProperties: false,
    },
    state: {},
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(5)
  expect(stats.totalAnswers).toBe(0)
  expect(stats.percentageQuestionsComplete).toBe(0)
  expect(stats.formCompleted).toBe(false)
})

test('getFormStats should calculate stats for an incomplete form with lots nested sections', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Technical Information',
      description:
        'The detailed technical model information section is designed for a technical customer of a model to understand.',
      type: 'object',
      properties: {
        description: {
          title: 'Description',
          type: 'object',
          properties: {
            modelDescription: {
              title: 'Model description',
              description: 'Detailed description of the model including architecture & training process.',
              type: 'string',
              maxLength: 10000,
            },
            technicalDocumentation: {
              title: 'Technical documentation',
              description:
                'Link to whitepapers or documents describing the architecture and/or training of the model. If possible, include any links to external repositories where the model code is stored',
              type: 'string',
              maxLength: 10000,
            },
          },
          additionalProperties: false,
        },
        provenance: {
          title: 'Provenance',
          type: 'object',
          properties: {
            modelFamily: {
              title:
                'If this model card is for a family of models with the same architecture and trained on similar data then please give details below.',
              type: 'string',
              maxLength: 10000,
            },
            parentModel: {
              title:
                'If this model has been produced by fine tuning another model, provide reference to the parent model here',
              description: 'Provide a link if possible',
              type: 'string',
              maxLength: 10000,
            },
            provenance: {
              title: 'Where was the model created?',
              description:
                'It may be appropriate to list more than one organisation/project if, for example, the model was originally open source but then re-trained and modified by us. e.g. internal/third-party/collaboration.',
              type: 'string',
            },
            additionalContacts: {
              title: 'Additional contacts',
              description: 'E.g., the creator of a 3rd party model or a commercial contact',
              type: 'string',
            },
            dateOfAcquisition: {
              title: 'Date of acquisition',
              description: 'If applicable, the date the model was acquired.',
              type: 'string',
              format: 'date',
            },
            licence: {
              title: 'Licence',
              type: 'object',
              properties: {
                description: {
                  title: 'If there is a licence associated with this model or dataset then please detail below',
                  type: 'string',
                  maxLength: 10000,
                },
                expiryDate: {
                  title: 'End date of license agreement (if applicable)',
                  description: 'What is the end date of this license agreement?',
                  type: 'string',
                  format: 'date',
                },
              },
            },
          },
          additionalProperties: false,
        },
        performance: {
          title: 'Performance',
          description: 'Information about model performance.',
          type: 'object',
          properties: {
            methodolog: {
              title: 'Performance evaluation - summary of methodology',
              description:
                'How is the performance of your model to be assessed? Include a summarised explanation of the methodology for each of your metrics.',
              type: 'string',
              maxLength: 10000,
            },
            summary: {
              title: 'Performance evaluation - summary of results',
              description: 'Free-text description of model performance, including metrics.',
              type: 'string',
              maxLength: 10000,
            },
            evaluation: {
              title: 'Full performance evaluation and/or further information',
              description: 'Links to documents or whitepapers containing more details of model performance.',
              type: 'string',
              maxLength: 10000,
            },
            metrics: {
              title: 'Performance Metrics',
              description: 'List of metrics, values, and the dataset they were evaluated on.',
              type: 'array',
              items: {
                type: 'object',
                title: '',
                properties: {
                  dataset: {
                    title: 'Dataset Used',
                    type: 'string',
                    maxLength: 100,
                  },
                  metrics: {
                    type: 'array',
                    title: 'Dataset Metrics',
                    items: {
                      type: 'object',
                      title: '',
                      properties: {
                        name: {
                          title: 'Metric name',
                          description: 'For example: ACCURACY.',
                          type: 'string',
                          maxLength: 100,
                        },
                        value: {
                          title: 'Model performance metric value',
                          description: 'For example: 82.',
                          type: 'number',
                        },
                      },
                    },
                  },
                },
                additionalProperties: false,
              },
              uniqueItems: true,
            },
          },
          additionalProperties: false,
        },
        additionalTechnicalInfo: {
          title: 'Additional technical information',
          type: 'object',
          properties: {
            developerDocumentation: {
              title: 'Link to developer documentation (if applicable)',
              description: 'Link to any additional useful developer documentation. ',
              type: 'string',
              maxLength: 10000,
            },
            inferencePerformanceRequirements: {
              title: 'Inference performance and requirements (if applicable)',
              description:
                'What are the performance characteristics of this model for inference (for example, time/query) and what hardware is required to run it effectively? ',
              type: 'string',
              maxLength: 10000,
            },
            inputFormat: {
              title: 'Input format (if applicable)',
              description: "This is the data the model takes as input for inference, such as 'UTF8 text'.",
              type: 'string',
              maxLength: 10000,
            },
            outputFormat: {
              title: 'Output format (if applicable)',
              description: 'The format of the data returned by the model. ',
              type: 'string',
              maxLength: 10000,
            },
          },
        },
      },
      additionalProperties: false,
    },
    state: {
      description: {
        modelDescription: 'bob',
      },
      provenance: {
        parentModel: 'bob',
        licence: {
          description: 'bob',
        },
      },
      performance: {
        summary: 'bob',
      },
      additionalTechnicalInfo: {
        developerDocumentation: 'bob',
        inputFormat: 'bob',
      },
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(16)
  expect(stats.totalAnswers).toBe(6)
  expect(stats.percentageQuestionsComplete).toBe(37.5)
  expect(stats.formCompleted).toBe(false)
})

test('getFormStats should calculate stats for an incomplete form with even more nested sections', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Risk, Limitation & Security',
      description:
        'The model risk, limitation and security section is designed for a non-technical customer of a model to understand.',
      type: 'object',
      properties: {
        risksAndLimitations: {
          title: 'Risks, Limitations',
          type: 'object',
          properties: {
            modelLimitations: {
              title: 'Model limitations',
              description: 'Are there known biases on the model that could introduce.',
              type: 'string',
              maxLength: 10000,
            },
            hasOutdatedInformation: {
              title: 'Outdated information potentially used to train the model or contained within its output',
              description:
                'Is there a likelihood that the model was trained on outdated information, or that its output, could cause additional concerns?.',
              type: 'string',
              maxLength: 10000,
            },
            modelBiasConsiderations: {
              title: 'Model bias consideration',
              description: 'What biases are known or reasonably believed to be present in the model?',
              type: 'string',
              maxLength: 10000,
            },
            ethicalConsiderations: {
              title: 'Ethical considerations',
              description: 'Outline any fairness or other ethical considerations or risks in the use of this model.',
              type: 'string',
              maxLength: 10000,
            },
          },
          additionalProperties: false,
        },
        dataPlanning: {
          title: 'Considerations around Data Planning',
          type: 'object',
          properties: {
            isPlanDifferent: {
              title:
                'If the data plan of the model is different to that of the aggregated training data then please justify and confirm as to why this is the case',
              type: 'string',
              maxLength: 10000,
            },
            dataRecoverability: {
              title: 'Data recoverability assessment',
              description: 'Is it reasonably possible that training data could be recovered from the model?',
              type: 'string',
              maxLength: 10000,
            },
            minimumOutputrequirement: {
              title: 'Minimum output',
              $ref: '#/definitions/output',
            },
            isMinimumOutputOutputDifferent: {
              title:
                'If the minimum output is different to that of the model then please justify and confirm as to why this is the case',
              type: 'string',
              maxLength: 10000,
            },
            isOpenSource: {
              title: 'Is the model open source? Please provide details',
              type: 'string',
              maxLength: 10000,
            },
            openSource: {
              title:
                'If the model is trained on data held under open source, explain why and confirm that this has been approved by the relevant policy team',
              type: 'string',
              maxLength: 10000,
            },
          },
          additionalProperties: false,
        },
        securityRisks: {
          title: 'Security Risks',
          type: 'object',
          properties: {
            securityRisksAndMitigations: {
              title: 'Security risks, considerations and mitigations',
              description: 'Are there any other security risks, considerations and their mitigations for this model?',
              type: 'string',
              maxLength: 10000,
            },
          },
        },
        modelCaveats: {
          title: 'Model caveats',
          type: 'object',
          properties: {
            modelOutputCaveats: {
              title: 'Model output handling caveats',
              description: 'Detail any handling caveats that should be presented to the end user.',
              type: 'string',
              maxLength: 10000,
            },
            modelOutputConfidenceStatement: {
              title: 'Model output confidence statement',
              description: 'Detail the model output confidence statement.',
              type: 'string',
              maxLength: 10000,
            },
          },
          additionalProperties: false,
        },
        modelSharing: {
          title: 'Model sharing',
          type: 'object',
          properties: {
            resourceSharing: {
              title: 'Sharing of models or systems containing ML technology',
              description: 'Details of sharing including the reason for sharing.',
              type: 'string',
              maxLength: 10000,
            },
            sharingPointsOfContact: {
              title: 'Sharing points of contact',
              description: 'Points of contact for sharing.',
              type: 'string',
              maxLength: 10000,
            },
          },
          additionalProperties: false,
        },
        usageAndLifecycle: {
          title: 'Usage and lifecycle',
          type: 'object',
          properties: {
            lifecyclePlan: {
              title: 'Lifecycle plan',
              description: 'Details or link to Lifecycle Plan.',
              type: 'string',
              maxLength: 10000,
            },
            frequency: {
              title: 'Model review frequency',
              description: 'How will reviews be triggered on this model?',
              type: 'string',
              enum: ['Periodic', 'Continuous', 'Other'],
            },
            lastReviewDate: {
              title: 'When was the model last reviewed?',
              type: 'string',
              format: 'date',
            },
            whoCompletedLastReview: {
              title: 'Who completed last model review?',
              type: 'array',
              widget: 'entitySelector',
              items: {
                title: 'User',
                type: 'string',
              },
              uniqueItems: true,
            },
            nextReviewDate: {
              title: 'Date next review will take place',
              type: 'string',
              format: 'date',
            },
            modelRetirementDate: {
              title: 'Date of model retirement',
              type: 'string',
              format: 'date',
            },
            modelRetirementDetails: {
              title: 'Details of model retirement (if applicable)',
              type: 'string',
              maxLength: 10000,
            },
            modelDeletionDate: {
              title: 'Date of model deletion',
              type: 'string',
              format: 'date',
            },
            modelDeletionDetails: {
              title: 'Details of model deletion (if applicable)',
              type: 'string',
              maxLength: 10000,
            },
            retraining: {
              title: 'Model retraining',
              type: 'object',
              properties: {
                frequency: {
                  title: 'Model retrain frequency',
                  description: 'How will reviews be triggered on this model?',
                  type: 'string',
                  enum: ['Periodic', 'Continuous', 'Other'],
                },
                frequencyDescription: {
                  title: 'Model retrain frequency description',
                  description:
                    'Please describe how the need for a review will be triggered (for example a new version from Open Source or a metric over threshold).',
                  type: 'string',
                },
              },
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    state: {},
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(25)
  expect(stats.totalAnswers).toBe(0)
  expect(stats.percentageQuestionsComplete).toBe(0)
  expect(stats.formCompleted).toBe(false)
})

test('getFormStats should calculate stats for a partially incomplete form with no nesting', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Overview',
      description: 'The overview section is designed for a non-technical customer of the model to understand.',
      type: 'object',
      properties: {
        summary: {
          title: 'Summary of the model',
          description:
            'This short summary should be designed for a non-technical user to understand the purpose and high-level architectural details of the model.',
          type: 'string',
          maxLength: 10000,
        },
        performanceSummary: {
          title: 'Summary of performance',
          description:
            'Summarise the performance metrics and any performance limitations of the model. Include any output confidence statement that must be presented to the end user.',
          type: 'string',
          maxLength: 10000,
        },
        riskAssessment: {
          title: 'Summary of risk assessment',
          description: 'Summarise the operational limitations, and any suggested restrictions on use.',
          type: 'string',
          maxLength: 10000,
        },
        confidenceStatement: {
          title: 'Confidence statement of output for users',
          description: 'Give handling caveats and confidence ratings that should be presented to the end user',
          type: 'string',
          maxLength: 10000,
        },
        datasets: {
          title: 'If there are any datasets related to this model please list them',
          type: 'array',
          widget: 'dataCardSelector',
          items: {
            type: 'string',
          },
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
    state: {
      performanceSummary: 'bob',
      riskAssessment: 'bob',
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(4)
  expect(stats.totalAnswers).toBe(2)
  expect(stats.percentageQuestionsComplete).toBe(50)
  expect(stats.formCompleted).toBe(false)
})

test('getFormStats should count an array field correctly', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Business Case',
      description: 'The business case section is designed for a non-technical customer of a model to understand.',
      type: 'object',
      properties: {
        need: {
          title: 'Need for creating the model',
          description: 'Detailed description.',
          type: 'string',
          maxLength: 10000,
        },
        function: {
          title: 'Applicable statutory function',
          type: 'array',
          widget: 'multiSelector',
          items: {
            type: 'string',
            enum: ['SHOE', 'HAT', 'SOCK', 'Not applicable'],
          },
          uniqueItems: true,
        },
        extraInfo: {
          title: 'Extra Information',
          description: 'List extra information',
          type: 'string',
          maxLength: 10000,
        },
      },
      additionalProperties: false,
    },
    state: {
      need: 'It is needed',
      function: ['SHOE', 'SOCK', 'HAT'],
      extraInfo: 'Because we need it now',
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(2)
  expect(stats.totalAnswers).toBe(3)
  expect(stats.percentageQuestionsComplete).toBe(100)
  expect(stats.formCompleted).toBe(true)
})

test('getFormStats should not count an array field if minItems is not set', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Business Case',
      description: 'The business case section is designed for a non-technical customer of a model to understand.',
      type: 'object',
      properties: {
        need: {
          title: 'Need for creating the model',
          description: 'Detailed description.',
          type: 'string',
          maxLength: 10000,
        },
        function: {
          title: 'Applicable statutory function',
          type: 'array',
          widget: 'multiSelector',
          items: {
            type: 'string',
            enum: ['SHOE', 'HAT', 'SOCK', 'Not applicable'],
          },
          uniqueItems: true,
        },
        extraInfo: {
          title: 'Extra Information',
          description: 'List extra information',
          type: 'string',
          maxLength: 10000,
        },
      },
      additionalProperties: false,
    },
    state: {
      need: 'It is needed',
      function: [],
      extraInfo: 'Because we need it now',
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(2)
  expect(stats.totalAnswers).toBe(2)
  expect(stats.percentageQuestionsComplete).toBe(100)
  expect(stats.formCompleted).toBe(true)
})

test('getFormStats should count an array field if minItems is set', () => {
  const step = {
    ...stepExample,
    schema: {
      definitions: {
        infoRequirement: {
          type: 'string',
          enum: ['DOG', 'CAT'],
        },
        entity: {
          type: 'string',
          description:
            "An entity can be a user, group or more. Entities follow the form type:identifier, e.g. 'user:test'.",
        },
      },
      title: 'Business Case',
      description: 'The business case section is designed for a non-technical customer of a model to understand.',
      type: 'object',
      properties: {
        need: {
          title: 'Need for creating the model',
          description: 'Detailed description.',
          type: 'string',
          maxLength: 10000,
        },
        function: {
          title: 'Applicable statutory function',
          type: 'array',
          minItems: 1,
          widget: 'multiSelector',
          items: {
            type: 'string',
            enum: ['SHOE', 'HAT', 'SOCK', 'Not applicable'],
          },
          uniqueItems: true,
        },
        extraInfo: {
          title: 'Extra Information',
          description: 'List extra information',
          type: 'string',
          maxLength: 10000,
        },
      },
      additionalProperties: false,
    },
    state: {
      need: 'It is needed',
      function: ['HAT', 'SOCK'],
      extraInfo: 'Because we need it now',
    },
  }
  const stats = getFormStats(step)
  expect(stats.totalQuestions).toBe(3)
  expect(stats.totalAnswers).toBe(3)
  expect(stats.percentageQuestionsComplete).toBe(100)
  expect(stats.formCompleted).toBe(true)
})

test('getOverallCompletionStats aggregates questions, answers, and pages correctly', () => {
  const steps: StepNoRender[] = [
    {
      ...stepExample,
      index: 0,
      section: 'Page 1',
      schema: {
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'string' },
        },
      },
      state: {
        a: 'answered',
      },
    },
    {
      ...stepExample,
      index: 1,
      section: 'Page 2',
      schema: {
        type: 'object',
        properties: {
          c: { type: 'string' },
        },
      },
      state: {
        c: 'answered',
      },
    },
  ]

  const stats = getOverallCompletionStats(steps)

  expect(stats.totalQuestions).toBe(3)
  expect(stats.totalAnswers).toBe(2)
  expect(stats.pagesCompleted).toBe(1)
  expect(stats.percentageQuestionsComplete).toBeCloseTo(66.7, 1)
  expect(stats.percentagePagesComplete).toBe(50)
  expect(stats.formCompleted).toBe(false)
})
