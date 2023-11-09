from bailo.core import Client, ModelVisibility
from bailo.helper.utils import retrieve_model
from typing import Any

class Model:
    def __init__(
        self,
        client: Client,
        name: str,
        description: str,
        visibility: ModelVisibility | None = ModelVisibility.Public,
        model_card: dict[str, Any] | None = None           
    ):
        self.client = client 
        self.name, self.description, self.visibility = name, description, visibility
        self.model_id = None
        self.model_version = None
        self.model_card_version = None
        self.model_card_schema = 'minimal-general-v10-beta'
        self.__model_card_original = model_card
        self.__model_card = model_card
        self.__local_dir = f"./temp_{name.strip(' ')}"  # property tbc
        self.__mc_change = 0
        self.__file_change = 0  # property tbc
        
    @classmethod
    def from_id(cls, client: Client, model_id: str):
        name, description, visibility, model_card, model_card_version, model_card_schema = retrieve_model(client=client, model_id=model_id)
        model = cls(
            client=client, 
            name=name,
            description=description,
            visibility=visibility,
            model_card=model_card
        )
        model.model_id = model_id
        model.model_card_version = model_card_version
        model.model_card_schema = model_card_schema

        return model

    def refresh(self):
        self.name, self.description, self.visibility, self.__model_card, self.model_card_version, self.model_card_schema = retrieve_model(client=self.client, model_id=self.model_id)

    def publish(self):
        if self.model_id is None:
            res = self.client.post_model(name=self.name, description=self.description, visibility=self.visibility)
            self.model_id = res['model']['id']

            # Upload model card
            if self.__model_card is not None:
                self.client.model_card_from_schema(model_id=self.model_id, schema_id=self.model_card_schema)
                self.client.put_model_card(model_id=self.model_id, metadata=self.__model_card)

            # Upload files (TBC)

        else:
            self.client.patch_model(model_id=self.model_id, name=self.name, description=self.description, visibility=self.visibility)

            if self.__mc_change == 1:
                if self.__model_card_original is None:
                    self.client.model_card_from_schema(model_id=self.model_id, schema_id=self.model_card_schema)
                
                self.client.put_model_card(model_id=self.model_id, metadata=self.__model_card)

            # Check files, new release? (TBC)
        
        self.refresh()
        self.__mc_change = 0
        self.__file_change = 0
    
    #def download():

    #def __upload():

    @property
    def model_card(self):
        return self.__model_card

    @model_card.setter
    def model_card(self, new):
        self.__mc_change = 1
        self.__model_card = new