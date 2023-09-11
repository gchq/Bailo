"""Main entry point"""
from __future__ import annotations
import requests
from typing import List, Optional
from .enums import ModelVisibility


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


class BailoClient:
    def __init__(self, url: str, agent: Agent = Agent()):
        """Initiate the Bailo client object.

        :param url: Specifies the destination of the Bailo service (can be a local or remote address).
        :type url: str
        :param agent: Specifies the requests agent, defaults to Agent().
        :type agent: Agent, optional
        """
        self.url = url.rstrip("/") + "/api"
        self.agent = agent

    def create_model(self, name: str, description: str, visibility: ModelVisibility):
        """Posts a new model to the Bailo service.

        :param name: Name of the ML model.
        :type name: str
        :param description: Description of the ML model.
        :type description: str
        :param visibility: Determines visibility of ML model.
        :type visibility: ModelVisibility
        :return: Returns a JSON object containing the server response.
        :rtype: json
        """
        return self.agent.post(
            f"{self.url}/v2/models",
            json={
                "name": name,
                "description": description,
                "visibility": visibility.value,
            },
        ).json()

    def find_models(
        self,
        task: Optional[str] = None,
        libraries: List[str] = [],
        filters: List[str] = [],
        search: str = "",
    ):
        """Gets models from the Bailo service that match required parameters.

        :param task: Description of the ML model, defaults to None.
        :type task: Optional[str], optional
        :param libraries: List of desired libraries (e.g. TensorFlow, PyTorch), defaults to []
        :type libraries: List[str], optional
        :param filters: Additional filters, defaults to []
        :type filters: List[str], optional
        :param search: Full text search against model cards, defaults to ""
        :type search: str, optional
        :return: JSON object containing the server response (matching models).
        :rtype: json
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
