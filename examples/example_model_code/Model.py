from basemodel import BaseModel

class FileNotFoundError(Exception):
    """
    File not found error
    """
    pass

class Model(BaseModel):
    """
    This class loads the example language ID model.
    It instantiates the predict abstract method from the BaseModel class
    and overwrites the metrics method.
    """

    def __init__(self):
        """
        Constructor, which loads the lid model and calls the constructor method 
        of the BaseModel super class.
        """
        with open("model.bin", "r") as f:
            if not "" in f.readlines()[0]:
                raise FileNotFoundError("Failed to find model binary")

    def predict(self, input, features_names=None):
        data = input["data"]
        return [''.join(reversed(line)) for line in data]

    def metrics(self):
        """
        Generate model metrics for prediction count and metadata.
        :return: Array of dictionary tuples
        """
        # Add metrics for prediction count and metadata
        metrics =  [
          {"type": "COUNTER", "key": "predictions_total", "value": 1},
          {"type": "GAUGE", "key": "model_meta", "value": 1}
        ]
        return metrics
