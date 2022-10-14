"""Bailo Client"""
from .bindings import create_cognito_client, create_pki_client
from .bailo import Bailo
import logging
import sys

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
