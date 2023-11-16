from __future__ import annotations
from bailo.core import Client, ModelVisibility

def retrieve_model(client: Client, model_id: str):
    res = client.get_model(model_id)['model']

    if res['visibility'] == 'private':
        visibility = ModelVisibility.Private
    else:
        visibility = ModelVisibility.Public
        
    try:
        model_card = res['card']['metadata']
        model_card_version = res['card']['version']
        model_card_schema = res['card']['schemaId']
    except:
        model_card = None
        model_card_version = None
        model_card_schema = 'minimal-general-v10-beta'

    return res['name'], res['description'], visibility, model_card, model_card_version, model_card_schema