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
        self.url = url.rstrip("/") + "/api"
        self.agent = agent

    def create_model(self, name: str, description: str, visibility: ModelVisibility):
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
        return self.agent.get(
            f"{self.url}/v2/models/search",
            json={
                "task": task,
                "libraries": libraries,
                "filters": filters,
                "search": search,
            },
        ).json()
