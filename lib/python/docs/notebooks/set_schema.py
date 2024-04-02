json_schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "overview": {
            "title": "Overview",
            "description": "Summary of the model functionality.",
            "type": "object",
            "properties": {
                "modelSummary": {
                    "title": "What does the model do?",
                    "description": "A description of what the model does.",
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 5000,
                },
                "tags": {
                    "title": "Descriptive tags for the model.",
                    "description": "These tags will be searchable and will help others find this model.",
                    "type": "array",
                    "widget": "tagSelector",
                    "items": {"type": "string"},
                    "uniqueItems": True,
                },
            },
            "required": [],
            "additionalProperties": False,
        },
        "performance": {
            "title": "Performance",
            "type": "object",
            "properties": {
                "performanceMetrics": {
                    "title": "Performance Metrics",
                    "description": "List of metrics, values, and the dataset they were evaluated on",
                    "type": "array",
                    "items": {
                        "type": "object",
                        "title": "",
                        "properties": {
                            "dataset": {"title": "Dataset used", "type": "string"},
                            "datasetMetrics": {
                                "type": "array",
                                "title": "Dataset Metrics",
                                "items": {
                                    "type": "object",
                                    "title": "",
                                    "properties": {
                                        "name": {
                                            "title": "Metric name",
                                            "description": "For example: ACCURACY",
                                            "type": "string",
                                        },
                                        "value": {
                                            "title": "Model performance metric value",
                                            "description": "For example: 82",
                                            "type": "number",
                                        },
                                    },
                                },
                            },
                        },
                    },
                }
            },
        },
    },
    "required": [],
    "additionalProperties": False,
}
