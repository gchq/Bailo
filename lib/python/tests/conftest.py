#   ---------------------------------------------------------------------------------
#   Copyright (c) Microsoft Corporation. All rights reserved.
#   Licensed under the MIT License. See LICENSE in project root for information.
#   ---------------------------------------------------------------------------------
"""
This is a configuration file for pytest containing customizations and fixtures.

In VSCode, Code Coverage is recorded in config.xml. Delete this file to reset reporting.
"""

from __future__ import annotations

import pytest
from bailo.core.client import Client
from bailo.core.enums import ModelVisibility
from bailo.helper.model import Model


@pytest.fixture
def integration_client():
    return Client("http://localhost:8080")


@pytest.fixture
def example_model(integration_client):
    model = Model.create(
        client=integration_client,
        name="Yolo-v4",
        description="You only look once!",
        team_id="team_id",
        visibility=ModelVisibility.PUBLIC,
    )
    model.card_from_schema("minimal-general-v10")
    return model
