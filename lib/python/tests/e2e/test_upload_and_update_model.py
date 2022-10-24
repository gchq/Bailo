import json
import os

from bailoclient import create_cognito_client
from dotenv import load_dotenv

os.environ["BAILO_URL"] = "http://localhost:8080/api/v1"


def test_upload_and_update_model():

    load_dotenv()

    ### Configure client based on local secrets
    client = create_cognito_client(
        user_pool_id=os.getenv("COGNITO_USERPOOL"),
        client_id=os.getenv("COGNITO_CLIENT_ID"),
        client_secret=os.getenv("COGNITO_CLIENT_SECRET"),
        region=os.getenv("COGNITO_REGION"),
        url=os.getenv("BAILO_URL"),
    )
    username = os.getenv("COGNITO_USERNAME")
    password = os.getenv("COGNITO_PASSWORD")

    client.connect(username=username, password=password)

    # Upload model
    with open("bailoclient/resources/minimal_metadata.json") as json_file:
        metadata = json.load(json_file)

    uploaded_model = client.upload_model(
        metadata=metadata,
        binary_file="../../__tests__/example_models/minimal_model/minimal_binary.zip",
        code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
    )

    model_uuid = uploaded_model["uuid"]
    model_card = client.get_model_card(model_uuid)

    assert uploaded_model.get("uuid")

    # Check that current user is model card owner
    user = client.get_me()
    assert user._id == model_card.owner

    # Check model schema
    model_schema = client.get_model_schema(model_uuid)
    assert model_schema["reference"] == "/Minimal/General/v10"

    # Update the model
    updated_model = client.update_model(
        model_card,
        binary_file="../../__tests__/example_models/minimal_model/minimal_binary.zip",
        code_file="../../__tests__/example_models/minimal_model/minimal_code.zip",
    )

    assert updated_model["uuid"] == model_uuid

    # Check a new version has been added
    updated_model_card = client.get_model_card(model_uuid)

    assert len(model_card.versions) == 1
    assert len(updated_model_card.versions) == 2
