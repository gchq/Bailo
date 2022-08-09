"""Example Bailo Client usage with PKI authentication"""

import datetime
import getpass
import json
import logging
import sys

from bailoclient import create_pki_client

# Configuration details; grab from env, but you can also just hard-code as below
# BAILO_URL = 'https://your.bailo.instance.com/api' # os.getenv('BAILO_URL')
BAILO_URL = "http://localhost:8080/api/v1"
P12_FILE = "/path/to/me.p12"  # os.getenv('P12_FILE')
CA = "/path/to/CA.crt"  # os.getenv('CA')
# Specify a specific file for CA verification
# True uses the default Ca bundle for verification
# False does no CA verification
P12_PW = getpass.getpass(prompt=f"Enter your password for {P12_FILE}: ")

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

# Configure client
client = create_pki_client(
    url=BAILO_URL, pkcs12_filename=P12_FILE, pkcs12_password=P12_PW, ca_verify=CA
)

### Connect to the Bailo instance
client.connect()

# Get all models and output their ids
models = client.get_models()
model_uuids = [m.uuid for m in models]

### Get and print a model card #####
# Grab a model card by uuid
model_card = client.get_model_card(model_uuid=model_uuids[0])

users = client.get_users()
user = client.get_user_by_name("user")

# Get one of your models and update it
me = client.get_me()
user_models = client.get_my_models()
model_card = user_models[0]
model_uuid = model_card.uuid

### Print model card as underlying JSON
print(model_card)

### Pretty print model card (indented json)
model_card.display()

### Output pretty print of model card as text
readable_json = model_card.display(to_screen=False)


##### Update a Model and Model Card #####

### Get list of fields within the model card
fields = dir(model_card)
# Tab auto completion works in iPython/Jupyter for fields (and nested fields)
""""
model_card.highLevelDetails.
                                      internallyCreated      name
                                      modelInASentence       securityClassification
                                      modelOverview          tags
"""
## Update a single field
now = datetime.datetime.now()
model_card.currentMetadata.name = f"Called from update_model on {now}"
model_card.currentMetadata.modelInASentence = "This is the updated model description"

### Validate the model card
result = model_card.validate()
for error in result.errors:
    print(f"{error.field}: {error.description}")
if result.is_valid:
    print("Our updated model validated against the model schema supplied Bailo!")


# Update the model and model card
update_resp = client.update_model(
    model_card=model_card,
    binary_file="../../../__tests__/example_models/minimal_model/minimal_binary.zip",
    code_file="../../../__tests__/example_models/minimal_model/minimal_code.zip",
)

print(f"Updated model: {update_resp}")

# Create a new model
with open("../../../__tests__/example_models/minimal_model/minimal_metadata.json") as json_file:
    metadata = json.load(json_file)

uploaded_model = client.upload_model(
    metadata=metadata,
    binary_file="../../../__tests__/example_models/minimal_model/minimal_binary.zip",
    code_file="../../../__tests__/example_models/minimal_model/minimal_code.zip",
)

print(f"Created new model: {uploaded_model}")

# You can also grab and inspect the model schema used for validation:
schema = client.get_model_schema(model_uuid)
