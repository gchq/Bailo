from bailoclient.config import BailoConfig
from bailoclient.auth import AuthenticationInterface
from bailoclient.api import APIInterface

from typing import Optional, Dict, Any
import os
import json


class MockAPI (APIInterface):
    '''Mock class to return API respones. It requires a response file formatted like {"VERB":{"/path/subpath":"response"}}. 
       VERB should be a standard HTTP verb (e.g. GET, POST, etc.).
       If the response data is the name of a JSON file that file will be loaded as the response instead. All paths are relative to the response file.
       Paths formatted as '/path/{variable}' will be handled at some point.
       Currently we don't handle request parameters or request bodies
    '''

    def __init__(self, config: BailoConfig, auth: AuthenticationInterface, responses: os.PathLike):
        self.config = config
        self.auth = auth
        self.load_responses(responses)

    def load_responses(self, response_file: str):
        '''Load responses from the passed file'''
        if not os.path.exists(response_file):
            raise FileNotFoundError(f"Response file {response_file} does not exist")

        with open(response_file, 'r') as f:
            responses_dict = json.load(f)

        self.responses = {}

        root_dir = os.path.dirname(response_file)

        for verb in responses_dict:
            self.responses[verb] = {}

            for response_type in responses_dict[verb]:
                data = responses_dict[verb][response_type]

                ### Check if we have a response or if it's pointing us at another file.
                if not data.endswith(".json"):
                    self.responses[verb][response_type] = data
                else:
                    data_path = os.path.join(root_dir, data)
                    if not os.path.exists(data_path):
                        raise FileNotFoundError(f"Response file {data_path} for {response_type} does not exist.")

                    with open(data_path, 'r') as fr:
                        self.responses[verb][response_type] = json.load(fr)
                    
 
    def _handle_request(self, verb: str, request_path: str, *args, **kwargs) -> Dict[str, str]:
        '''Internal function to handle auth and reading from the response dictionary'''

        if not self.auth.is_authenticated():
            result = self.auth.authenticate_user()
            if not result:
                return None

        if request_path in self.responses[verb]:
            return self.responses["GET"][request_path]

        raise Exception(f"Response missing for {request_path}")



    def get(self, request_path: str, request_params: Optional[Dict[str, str]]=None) -> Dict[str, str]:
        '''Make a GET request against the mock API requests. This will not do any validation of parameters prior to sending.
        
        request_path: The requested path relative to the API (e.g. /model/summary)
        request_params: Any query parameters to be passed to the API
        return: A JSON object returned by the API. Throws an exception if the request fails
        '''

        return self._handle_request("GET", request_path, request_params)

    def post(self, request_path: str, request_body: str, request_params: Optional[Dict[str, str]]=None) -> Dict[str, str]:
        '''Make a POST request against the mock API. This will not do any validation of parameters prior to sending.
        
        request_path: The requested path relative to the API (e.g. /model/summary)
        request_body: The full request body as a string
        request_params: Any query parameters to be passed to the API
        return: A JSON object returned by the API. Throws an exception if the request fails
        '''
        
        return self._handle_request("POST", request_path, request_params, request_body)


    def put(self, request_path: str, request_body: str, request_params: Optional[Dict[str, str]]=None) -> Dict[str, str]:
        '''Make a PUT request against the mock API. This will not do any validation of parameters prior to sending.
        
        request_path: The requested path relative to the API (e.g. /model/summary)
        request_body: The full request body as a string
        request_params: Any query parameters to be passed to the API
        return: A JSON object returned by the API. Throws an exception if the request fails
        '''
        
        return self._handle_request("PUT", request_path, request_params, request_body)


    