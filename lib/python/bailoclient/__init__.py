"""Bailo Client"""

import logging
import sys

from bailoclient.bailo import Bailo
from bailoclient.client import (
    Client,
    create_cognito_client,
    create_null_client,
    create_pki_client,
)
from bailoclient.config import BailoConfig, Pkcs12Config, CognitoConfig
from bailoclient.enums import AuthType

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
