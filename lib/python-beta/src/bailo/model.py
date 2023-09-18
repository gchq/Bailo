from typing_extensions import TypedDict, NotRequired
from .enums import ModelVisibility

class Model(TypedDict):
    name: NotRequired[str]
    description: NotRequired[str]
    visibility: NotRequired[ModelVisibility]
