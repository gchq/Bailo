from .basemodel import BaseModel


class KerasModel(BaseModel):
    def __init__(self, keras_model, graph, sess):
        self.keras_model = keras_model
        self._graph = graph
        self._sess = sess

    def predict(self, data):
        import pandas as pd

        def _predict(data):
            if isinstance(data, pd.DataFrame):
                predicted = pd.DataFrame(self.keras_model.predict(data.values))
                predicted.index = data.index

            else:
                predicted = self.keras_model.predict(data)

            return predicted

        # In TensorFlow < 2.0, we use a graph and session to predict
        if self._graph is not None:
            with self._graph.as_default():
                with self._sess.as_default():
                    predicted = _predict(data)

        # In TensorFlow >= 2.0, we do not use a graph and session to predict
        else:
            predicted = _predict(data)

        return predicted
