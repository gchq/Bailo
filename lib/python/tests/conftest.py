#   ---------------------------------------------------------------------------------
#   Copyright (c) Microsoft Corporation. All rights reserved.
#   Licensed under the MIT License. See LICENSE in project root for information.
#   ---------------------------------------------------------------------------------
"""
This is a configuration file for pytest containing customizations and fixtures.

In VSCode, Code Coverage is recorded in config.xml. Delete this file to reset reporting.
"""

from __future__ import annotations

import pytest
import random
import mlflow
from bailo.core.client import Client
from bailo.core.enums import ModelVisibility, SchemaKind
from bailo.helper.model import Model
from bailo.helper.schema import Schema


@pytest.fixture
def integration_client():
    return Client("http://localhost:8080")


@pytest.fixture
def example_model(integration_client, metrics_schema):
    model = Model.create(
        client=integration_client,
        name="Yolo-v4",
        description="You only look once!",
        team_id="team_id",
        visibility=ModelVisibility.PUBLIC,
    )
    model.card_from_schema(metrics_schema.schema_id)

    new_card = {
        'overview': {
        'tags': [],
        'modelSummary': 'YOLOv5 model for object detection.',
        }
    }
    model.update_model_card(model_card=new_card)
    return model


@pytest.fixture
def local_model():
    client = Client("https://example.com")
    visibility = ModelVisibility.PUBLIC
    model = Model(
        client=client,
        model_id="test-id",
        name="test",
        description="test",
        visibility=visibility,
    )
    return model

@pytest.fixture(scope="session")
def weights_path(tmpdir_factory):
    weights = "Test Weights"
    fn = tmpdir_factory.mktemp("data").join("weights.pth")
    with open(str(fn), "w") as weights_file:
        weights_file.write(weights)
    return fn    

@pytest.fixture
def standard_experiment(example_model, weights_path):
    experiment = example_model.create_experiment()

    # Arbitrary params
    params = {
        "lr": 0.01,
        "anchor_t": 4.0,
        "scale": 0.5,
    }

    # Arbitrary metrics
    metrics = {
        "accuracy": 0.98,
    }

    for x in range(5):
        experiment.start_run()
        experiment.log_params(params)
        experiment.log_metrics(metrics)
        experiment.log_artifacts([str(weights_path)])
        experiment.log_dataset("test_dataset")

    return experiment


@pytest.fixture
def mlflow_id(weights_path):
    mlflow_client = client = mlflow.tracking.MlflowClient(tracking_uri="http://127.0.0.1:5000")
    experiment_name = f"Test_{str(random.randint(1, 1000000))}"
    mlflow_id = mlflow_client.create_experiment(name=experiment_name)

    params = {
        "lr": 0.01,
        "anchor_t": 4.0,
        "scale": 0.5,
    }

    # Setting local tracking URI and experiment name
    mlflow.set_tracking_uri(uri="http://127.0.0.1:5000")
    mlflow.set_experiment(experiment_id=mlflow_id)

    # Logging the same metrics to the local MLFlow server
    with mlflow.start_run():
        mlflow.log_params(params)
        mlflow.log_metric("accuracy", 0.86)
        mlflow.log_artifact(str(weights_path))
        mlflow.set_tag("Training Info", "YOLOv5 Demo Model")

    return mlflow_id

@pytest.fixture
def metrics_schema(integration_client):
    schema_id = str(random.randint(1, 1000000))

    json_schema = {
        "$schema":"http://json-schema.org/draft-07/schema#",
        "type":"object",
        "properties":{
            "overview":{
                "title":"Overview",
                "description":"Summary of the model functionality.",
                "type":"object",
                "properties":{
                    "modelSummary":{
                    "title":"What does the model do?",
                    "description":"A description of what the model does.",
                    "type":"string",
                    "minLength":1,
                    "maxLength":5000
                    },
                    "tags":{
                    "title":"Descriptive tags for the model.",
                    "description":"These tags will be searchable and will help others find this model.",
                    "type":"array",
                    "widget":"tagSelector",
                    "items":{
                        "type":"string"
                    },
                    "uniqueItems":True
                    }
                },
                "required":[
                
                ],
                "additionalProperties":False
            },
            "performance":{
                "title":"Performance",
                "type":"object",
                "properties":{
                    "performanceMetrics":{
                    "title":"Performance Metrics",
                    "description":"List of metrics, values, and the dataset they were evaluated on",
                    "type":"array",
                    "items":{
                        "type":"object",
                        "title":"",
                        "properties":{
                            "dataset":{
                                "title":"Dataset used",
                                "type":"string"
                            },
                            "datasetMetrics":{
                                "type":"array",
                                "title":"Dataset Metrics",
                                "items":{
                                "type":"object",
                                "title":"",
                                "properties":{
                                    "name":{
                                        "title":"Metric name",
                                        "description":"For example: ACCURACY",
                                        "type":"string"
                                    },
                                    "value":{
                                        "title":"Model performance metric value",
                                        "description":"For example: 82",
                                        "type":"number"
                                    }
                                }
                                }
                            }
                        }
                    }
                    }
                }
            }
        },
        "required":[
        
        ],
        "additionalProperties":False
        }
    
    schema = Schema.create(
        client=integration_client,
        schema_id=schema_id,
        name="metrics-schema-test",
        description="Metrics schema test.",
        kind=SchemaKind.MODEL,
        json_schema=json_schema,
    )

    return schema