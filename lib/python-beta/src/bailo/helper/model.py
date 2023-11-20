from __future__ import annotations

from typing import Any

from bailo.core import Client, ModelVisibility


class Model:
    def __init__(self):
        self.client = None

        self.model_id = None
        self.name = None
        self.description = None
        self.visibility = None

        self.model_card = None
        self.model_card_version = None
        self.model_card_schema = None

    @classmethod
    def create(
        cls,
        client: Client,
        name: str,
        description: str,
        team_id: str,
        visibility: ModelVisibility | None = None,
    ):
        model = cls()
        model.client = client
        res = model.client.post_model(
            name=name,
            description=description,
            team_id=team_id,
            visibility=visibility
        )
        model.__unpack(res['model'])

        return model

    @classmethod
    def from_id(cls, client: Client, model_id: str):
        model = cls()
        model.client = client
        res = model.client.get_model(model_id=model_id)
        model.__unpack(res['model'])

        #get latest model card?

        return model

    def update(self):
        res = self.client.patch_model(model_id=self.model_id, name=self.name, description=self.description, visibility=self.visibility)
        self.__unpack(res['model'])

    #MODEL CARD
    #Should model_card be a param? Or should we call the attribute?
    def update_model_card(self, model_card: dict[str, Any]):
        res = self.client.put_model_card(model_id=self.model_id, metadata=model_card)
        self.__unpack_mc(res['card'])

    def card_from_schema(self, schema_id: str):
        res = self.client.model_card_from_schema(model_id=self.model_id, schema_id=schema_id)
        self.__unpack_mc(res['card'])

    def card_from_model(self):
        pass

    def card_from_template(self):
        pass

    def get_card_latest(self):
        res = self.client.get_model(model_id=self.model_id)
        self.__unpack_mc(res['model']['card'])

    def get_card_revision(self, version: str):
        res = self.client.get_model_card(model_id=self.model_id, version=version)
        self.__unpack_mc(res['modelCard'])

    #RELEASE
    def create_release(self):
        pass

    def get_releases(self):
        pass

    def get_release(self):
        pass

    #FILES ??

    #IMAGES
    def get_images(self):
        pass

    def get_image(self): #gets image ref
        pass

    #ROLES
    def get_roles(self):
        res = self.client.get_model_roles(model_id=self.model_id)

        return res['roles']

    def get_user_roles(self):
        res = self.client.get_model_user_roles(model_id=self.model_id)

        return res['roles']

    #MISC
    def __unpack(self, res):
        self.model_id = res['id']
        self.name = res['name']
        self.description = res['description']

        if res['visibility'] == 'private':
            self.visibility = ModelVisibility.Private
        else:
            self.visibility = ModelVisibility.Public

    def __unpack_mc(self, res):
        self.model_card_version = res['version']
        self.model_card_schema = res['schemaId']

        try:
            self.model_card = res['metadata']
        except:
            self.model_card = None
