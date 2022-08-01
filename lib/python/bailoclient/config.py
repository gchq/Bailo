from pydantic import BaseSettings, HttpUrl
from typing import Optional, Union

import os
import yaml
import json

class APIConfig(BaseSettings):
    '''Configuration for the Bailo API'''
    
    url: HttpUrl
    ca_verify: Union[bool,str]

class Pkcs12Config(BaseSettings):
    '''Configuration for connecting using Pkcs12 certificate'''
    pkcs12_filename: str
    pkcs12_password: str

class CognitoConfig(BaseSettings):
    '''Configuration for connecting to an AWS Cognito instance.'''
    
    user_pool_id: str
    client_id: str
    client_secret: str
    region: str
        
class BailoConfig(BaseSettings):
    '''Master configuration object'''
    
    cognito: Optional[CognitoConfig]
    pki: Optional[Pkcs12Config]
    api: APIConfig
            

            
def load_config(config_path: os.PathLike) -> BailoConfig:
    '''Loads and validates a configuration file. Raises an exception if unable to read or load the file.
    
    : config_file: A path object pointing to a yaml configuration file
    : returns: A configuration object
    '''
    
    ### Do some basic error checking
    if not os.path.exists(config_path):
        raise FileNotFoundError("Configuration file {} not found".format(config_path))

        
    ### Load file as a yaml document
    with open(config_path, 'r') as f:
        config_data = yaml.safe_load(f)
        
    try:
        config = BailoConfig.parse_obj(config_data)
    except Exception as exc:
        print(exc)
        raise RuntimeError("Configuration file data could not be interpreted as a valid config.")
        
    return config
        
def save_config(config: BailoConfig, config_path: os.PathLike):
    ''' Saves a current config as a yaml file. Raises an exception if it is unable to save.
    
    : config: A python config object
    : config_path: Target path to save as a yaml file
    '''
    
    ### Do error checking
    if os.path.isdir(config_path):
        raise IsADirectoryError("Invalid configuration filepath. {} is a directory".format(config_path))
        
    ### Write configuration to file
    with open(config_path, 'w') as f:
        # Do a round-trip via JSON to take advantage of pydantics encoders
        yaml.dump(json.loads(config.json()), f)

    
        
    
