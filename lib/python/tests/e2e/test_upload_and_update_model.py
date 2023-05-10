import json
import os

import pytest

from bailoclient.client import Client
from bailoclient.config import BailoConfig, CognitoConfig

os.environ["BAILO_URL"] = "http://localhost:8080/api/v1"


@pytest.fixture
def cognito_client():
    # load_dotenv()

    ### Configure client based on local secrets
    config = BailoConfig(
        auth=CognitoConfig(
            username=os.getenv("COGNITO_USERNAME"),
            password=os.getenv("COGNITO_PASSWORD"),
            user_pool_id=os.getenv("COGNITO_USERPOOL"),
            client_id=os.getenv("COGNITO_CLIENT_ID"),
            client_secret=os.getenv("COGNITO_CLIENT_SECRET"),
            region=os.getenv("COGNITO_REGION"),
        ),
        bailo_url=os.getenv("BAILO_URL"),
    )
    return Client(config)


@pytest.fixture
def null_client():
    config = BailoConfig(bailo_url=os.getenv("BAILO_URL"), ca_verify=True)
    return Client(config)


def test_upload_and_update_model(null_client):
    client = null_client

    # Upload model
    with open(
        os.path.join(
            os.path.dirname(__file__),
            "../../bailoclient/resources/minimal_metadata.json",
        )
    ) as json_file:
        metadata = json.load(json_file)

    uploaded_model = client.upload_model(
        metadata=metadata,
        binary_file=os.path.join(
            os.path.dirname(__file__), "../../bailoclient/resources/minimal_binary.zip"
        ),
        code_file=os.path.join(
            os.path.dirname(__file__), "../../bailoclient/resources/minimal_code.zip"
        ),
    )

    model_uuid = uploaded_model["uuid"]
    model_card = client.get_model_card(model_uuid)

    assert uploaded_model.get("uuid")

    # Check that current user is model card owner
    user = client.get_me()

    assert user.id == model_card.latestVersion.metadata.contacts.uploader[0].id

    # Check model schema
    model_schema = client.get_model_schema(model_uuid)
    assert model_schema["reference"] == "/Minimal/General/v10"

    # update model card
    new_model_card = model_card.latestVersion.metadata.copy()
    new_model_card.highLevelDetails.name = "Updated Model"
    new_model_card.highLevelDetails.modelCardVersion = "v2.0"

    # Update the model
    updated_model = client.update_model(
        new_model_card,
        model_uuid,
        binary_file=os.path.join(
            os.path.dirname(__file__), "../../bailoclient/resources/minimal_binary.zip"
        ),
        code_file=os.path.join(
            os.path.dirname(__file__), "../../bailoclient/resources/minimal_code.zip"
        ),
    )

    assert updated_model["uuid"] == model_uuid

    # Check a new version has been added
    updated_model_card = client.get_model_card(model_uuid)

    assert len(model_card.versions) == 1
    assert len(updated_model_card.versions) == 2
