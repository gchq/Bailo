"""An object orientated class structure for Bailo's API.

This module allows interaction of Models, Releases, Access Requests and Schemas.


>>> from bailo import Model, Client
>>>
>>> client = Client("https://bailo.com") # URL of Bailo

To import a resource from Bailo:

>>> my_model = Model.from_id("yolov4")

To create a resource that will be automatically reflected in Bailo:

>>> my_model = Model.create(
    client=client,
    name="YoloV4",
    description="You only look once!",
    team_id="Uncategorised"
)
"""
