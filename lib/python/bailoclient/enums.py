"""Enum types for use in bailoclient"""

from enum import Enum, EnumMeta


class AuthType(Enum):
    """Enumeration of compatible authentication types"""

    COGNITO = "cognito"
    PKI = "pki"
    NULL = "null"


class ModelFlavoursMeta(EnumMeta):
    def __contains__(cls, item):
        if not item:
            return False

        return isinstance(item, cls) or item in [
            v.value for v in cls.__members__.values()
        ]


class ModelFlavour(Enum, metaclass=ModelFlavoursMeta):
    H2O = "h2o"
    KERAS = "keras"
    MLEAP = "mleap"
    PYTORCH = "torch"
    SKLEARN = "sklearn"
    SPARK = "spark"
    TENSORFLOW = "tensorflow"
    ONNX = "onnx"
    GLUON = "gluon"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    CATBOOST = "catboost"
    SPACY = "spacy"
    FASTAI = "fastai"
    STATSMODELS = "statsmodels"
    PROPHET = "prophet"
