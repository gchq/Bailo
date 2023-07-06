import pickle


class SklearnModel(object):
    """
    Model template. You can load your model parameters in __init__ from a location accessible at runtime
    """

    def __init__(self):
        with open("../binary/model.pickle", "rb") as model_file:
            self._model = pickle.load(model_file)

    def predict(self, X, feature_names):
        predictions = self._model.predict(X)
        return predictions
