from abc import ABC, abstractmethod


class BaseModel(ABC):
    """
    The BaseModel class provides an abstract template for model contributors.
    Models must provide a predict method but do not have to provide metrics or metadata
    """

    @abstractmethod
    def __init__(self):
        """
        The model should be loaded here in the Model sub-class generated
        from the BaseModel abstract class

        Example:
            self.model = load_model("model")
        """
        super().__init__()

    @abstractmethod
    def predict(self, input, features_names):
        """
        Provides a model prediction for a given input and set of feature names
        :param input: Prediction input containing a data component
        :param feature_names: Optional set of feature names
        :return: JSON serialisable numpy array, list of values, string or bytes

        Example:
            data = input["data"]
            result = self.model.predict(data)
            return result
        """
        pass

    def metrics(self):
        """
        Optional method for adding additional metrics
        :return:

        Example:
            return an array of metrics tuples
            metrics =  [{"type": "COUNTER", "key": "metric_1", "value": 1}]
            return metrics
        """
        pass

    def metadata(self):
        """
        Optional metadata method.
        :return:

        Example:
            meta = {"field": "value"}
            return meta
        """
        pass
