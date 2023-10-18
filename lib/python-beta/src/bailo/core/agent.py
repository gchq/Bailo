import requests

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