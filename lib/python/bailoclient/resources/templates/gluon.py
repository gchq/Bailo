from .basemodel import BaseModel


class GluonModel(BaseModel):
    def __init__(self, gluon_model):
        self.gluon_model = gluon_model

    def predict(self, data):
        """
        :param data: Either a pandas DataFrame or a numpy array containing input array values.
                     If the input is a DataFrame, it will be converted to an array first by a
                     `ndarray = df.values`.
        :return: Model predictions. If the input is a pandas.DataFrame, the predictions are returned
                 in a pandas.DataFrame. If the input is a numpy array, the predictions are returned
                 as either a numpy.ndarray or a plain list for hybrid models.
        """
        import mxnet as mx
        import pandas as pd

        if isinstance(data, pd.DataFrame):
            ndarray = mx.nd.array(data.values)
            preds = self.gluon_model(ndarray)

            if isinstance(preds, mx.ndarray.ndarray.NDArray):
                preds = preds.asnumpy()

            return pd.DataFrame(preds)

        elif isinstance(data, np.ndarray):
            ndarray = mx.nd.array(data)
            preds = self.gluon_model(ndarray)

            if isinstance(preds, mx.ndarray.ndarray.NDArray):
                preds = preds.asnumpy()

            return preds

        else:
            raise TypeError("Input data should be pandas.DataFrame or numpy.ndarray")
