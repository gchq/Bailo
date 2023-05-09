# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

import os
import sys

sys.path.insert(0, os.path.abspath("../.."))

import bailoclient

project = "Bailo"
copyright = "2023, GCHQ"
author = "GCHQ"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

master_doc = "index"
extensions = [
    "sphinx.ext.autodoc",  # extract docs from docstrings
    "sphinx.ext.napoleon",  # google style docstring format
    "m2r2",  # markdown support
    "myst_nb",  # notebook support
]

autodoc_typehints = "description"
autodoc_typehints_description_target = "all"
nb_execution_mode = "off"


templates_path = ["_templates"]
exclude_patterns = []


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "alabaster"
html_static_path = ["_static"]
