export const schemaJson = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    timeStamp: {
      type: 'string',
      format: 'date-time',
    },
    schemaRef: {
      title: 'Schema reference',
      type: 'string',
    },
    highLevelDetails: {
      title: 'Overview',
      description: 'Summary of the model functionality.',
      type: 'object',
      properties: {
        name: {
          title: 'Name of the Machine Learning Model',
          description:
            "This should be descriptive name, such as 'Arabic - English Translation', and will be visible in the model marketplace.",
          type: 'string',
          minLength: 1,
          maxLength: 140,
          widget: 'customTextInput',
        },
        modelInASentence: {
          title: 'Summarise the model in a sentence',
          description:
            "This sentence will allow an individual to decide if they want to open the model card to read further Example: 'Takes Arabic text snippet inputs and outputs an English translation.'",
          type: 'string',
          minLength: 1,
          maxLength: 140,
          widget: 'customTextInput',
        },
        modelOverview: {
          title: 'What does the model do?',
          description: 'A description of what the model does.',
          type: 'string',
          minLength: 1,
          maxLength: 5000,
          widget: 'customTextInput',
        },
        modelCardVersion: {
          type: 'string',
          title: 'Model version',
          maxLength: 100,
          pattern: '^[a-zA-Z0-9\\_\\-\\.]{0,128}$',
          widget: 'customTextInput',
        },
        tags: {
          title: 'Descriptive tags for the model.',
          description: 'These tags will be searchable and will help others find this model.',
          type: 'array',
          widget: 'tagSelector',
          items: {
            type: 'string',
          },
          uniqueItems: true,
        },
      },
      required: ['name', 'modelInASentence', 'modelOverview', 'modelCardVersion', 'tags'],
      additionalProperties: false,
    },
    anotherPage: {
      title: 'Another Page',
      description: 'This is a second page',
      type: 'object',
      properties: {
        questionOne: {
          title: 'Question one',
          description: 'This is a question',
          type: 'string',
          widget: 'customTextInput',
        },
        questionTwo: {
          title: 'Question two',
          description: 'This is another question',
          type: 'string',
          widget: 'customTextInput',
        },
      },
      required: ['questionOne, questionTwo'],
    },
  },
  required: ['timeStamp', 'highLevelDetails'],
}
