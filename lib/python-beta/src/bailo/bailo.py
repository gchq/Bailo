"""Main entry point"""
from __future__ import annotations
import requests
from typing import List, Optional, Any
from .enums import ModelVisibility
from .model import Model

class Agent:
    def __init__(self):
        self.get = requests.get
        self.post = requests.post
        self.put = requests.put
        self.patch = requests.patch
        self.delete = requests.delete


class PkiAgent(Agent):
    def get(self, *args, **kwargs):
        return requests.get(*args, **kwargs)


class BailoClient():
    def __init__(self, url: str, agent: Agent = Agent()):
        self.url = url.rstrip("/") + "/api"
        self.agent = agent

    def create_model(
            self,
            model: Model,
        ):
        """
        Creates a new model.

        :param model: Model object containing name, description and visibility.
        :return: JSON response object
        """
        return self.agent.post(
            f"{self.url}/v2/models",
            json={
                "name": model["name"],
                "description": model["description"],
                "visibility": model["visibility"].value,
            },
        ).json()

    def find_models(
        self,
        task: Optional[str] = None,
        libraries: List[str] = [],
        filters: List[str] = [],
        search: str = "",
    ):
        """
        Finds and returns a list of models based on provided search terms.

        :param task: Model task (e.g. image classification), defaults to None
        :param libraries: Model library (e.g. TensorFlow), defaults to []
        :param filters: Custom filters, defaults to []
        :param search: String to be located in model cards, defaults to ""
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/models/search",
            json={
                "task": task,
                "libraries": libraries,
                "filters": filters,
                "search": search,
            },
        ).json()

    def get_model(
        self,
        model_id: str,
    ):
        """
        Retrieves a specific model using its unique ID.

        :param model_id: Unique model ID
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}",
        ).json()

    def update_model(
        self,
        model_id: str,
        model: Model,
    ):
        """
        Updates a specific model using its unique ID.

        :param model_id: Unique model ID
        :param model: Model object containing name, description and/or visibility.
        :return: JSON response object
        """ 
        return self.agent.patch(
            f"{self.url}/v2/model/{model_id}",
            json=model,
        ).json()

    def get_model_card(
        self,
        model_id: str,
        version: str,
    ):
        """
        Retrieves a specific model card, using the unique model ID and version.

        :param model_id: Unique model ID
        :param version: Model card version
        :return: JSON response object
        """
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/model-card/{version}",
        ).json()

    def update_model_card(
        self,
        model_id: str,
        metadata: Any,
    ):
        """
        Updates the latest model card, using the unique model ID.

        :param model_id: Unique model ID
        :param metadata: Metadata object, defined by model card schema
        :return: JSON response object
        """        
        return self.agent.put(
            f"{self.url}/v2/model/{model_id}/model-cards",
            json={
                "metadata": metadata,
            },
        ).json()

    def model_card_from_schema(
        self,
        model_id: str,
        schema_id: str,
    ):
        """
        Creates a model card using a given schema ID.

        :param model_id: Unique model ID
        :param schema_id: Unique model card schema ID
        :return: JSON response object
        """        
        return self.agent.post(
            f"{self.url}/v2/model/{model_id}/setup/from-schema",
            json={
                "schemaId": schema_id,
            },
        ).json()
    
    def create_release(
        self,
        model_id: str,
        model_card_version: float,
        release_version: str,
        notes: str,
        files: List[str],
        images: List[str],
        minor: Optional[bool] = False,
        draft: Optional[bool] = False,
    ):
        """
        Creates a new model release.

        :param model_id: Unique model ID
        :param model_card_version: Model card version
        :param release_version: Release version
        :param notes: Notes on release
        :param files: Files for release
        :param images: Images for release
        :param minor: Signifies a minor release, defaults to False
        :param draft: Signifies a draft release, defaults to False
        :return: JSON response object
        """        
        return self.agent.post(
            f"{self.url}/v2/model/{model_id}/releases",
            json={
                "modelCardVersion": model_card_version,
                "semver": release_version,
                "notes": notes,
                "minor": minor,
                "draft": draft,
                "files": files,
                "images": images
            },
        ).json()

    def get_all_releases(
        self,
        model_id: str,
    ):
        """
        Gets all releases for a model.

        :param model_id: Unique model ID
        :return: JSON response object
        """        
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/releases",
        ).json()

    def get_release(
        self,
        model_id: str,
        release_version: str
    ):
        """
        Gets a specific model release.

        :param model_id: Unique model ID
        :param release_version: Release version
        :return: JSON response object
        """        
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/releases/{release_version}",
        ).json()

    def delete_release(
        self,
        model_id: str,
        release_version: str,
    ):
        """
        Deletes a specific model release.

        :param model_id: Unique model ID
        :param release_version: Release version
        :return: JSON response object
        """        
        return self.agent.delete(
            f"{self.url}/v2/model/{model_id}/releases/{release_version}",
        ).json()
    
    def get_files(
        self,
        model_id: str,
    ):
        """
        Gets files for a model.

        :param model_id: Unique model ID
        :return: JSON response object
        """        
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/files",
        ).json()
    
    #def simple_upload(): TBC

    #def start_multi_upload(): TBC

    #def finish_multi_upload(): TBC

    def delete_file(
        self,
        model_id: str,
        file_id: str,
    ):
        """
        Deletes a specific file associated with a model.

        :param model_id: Unique model ID
        :param file_id: Unique file ID
        :return: JSON response object
        """        
        return self.agent.delete(
            f"{self.url}/v2/model/{model_id}/files/{file_id}",
        ).json()
    
    #def get_all_schemas():

    #def get_schema():

    #def create_schema():

    #def get_reviews():

    #def get_reviews_count():

    def get_model_roles(
        self,
        model_id: str,
    ):
        """
        Gets roles for a model.

        :param model_id: Unique model ID
        :return: JSON response object
        """        
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/roles",
        ).json()

    def get_model_user_roles(
        self,
        model_id: str,
    ):
        """
        Gets current users roles for a model.

        :param model_id: Unique model ID
        :return: JSON response object
        """        
        return self.agent.get(
            f"{self.url}/v2/model/{model_id}/roles/mine",
        ).json()
    
    def create_team(
        self,
        team_id: str,
        name: str,
        description: str,
    ):
        """
        Create new team.

        :param team_id: Unique team ID
        :param name: Team name
        :param description: Team description
        :return: JSON response object
        """        
        return self.agent.post(
            f"{self.url}/v2/teams",
        ).json()
    
    def get_all_teams(
        self,
    ):
        """
        Get all teams.

        :return: JSON response object
        """        
        return self.agent.get(
            f"{self.url}/v2/teams",
        ).json()
    
    def get_user_teams(
        self,
    ):
        """
        Get user teams.

        :return: JSON response object
        """        
        return self.agent.get(
            f"{self.url}/v2/teams/mine",
        ).json()