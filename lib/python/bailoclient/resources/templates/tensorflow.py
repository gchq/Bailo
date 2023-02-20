from .basemodel import BaseModel


class TensorflowModel(BaseModel):
    """
    Wrapper class that exposes a TensorFlow model for inference via a ``predict`` function such that
    ``predict(data: pandas.DataFrame) -> pandas.DataFrame``. For TensorFlow versions >= 2.0.0.
    """

    def __init__(self, model, infer):
        """
        :param model: A Tensorflow SavedModel.
        :param infer: Tensorflow function returned by a saved model that is used for inference.
        """
        # Note: we need to retain the model reference in TF2Wrapper object, because the infer
        #  function in tensorflow will be `ConcreteFunction` which only retains WeakRefs to the
        #  variables they close over.
        #  See https://www.tensorflow.org/guide/function#deleting_tfvariables_between_function_calls
        self.model = model
        self.infer = infer

    def predict(self, data):
        import tensorflow
        import pandas as pd
        import numpy as np

        feed_dict = {}
        if isinstance(data, dict):
            feed_dict = {k: tensorflow.constant(v) for k, v in data.items()}
        elif isinstance(data, pd.DataFrame):
            for df_col_name in list(data):
                # If there are multiple columns with the same name, selecting the shared name
                # from the DataFrame will result in another DataFrame containing the columns
                # with the shared name. TensorFlow cannot make eager tensors out of pandas
                # DataFrames, so we convert the DataFrame to a numpy array here.
                val = data[df_col_name]
                if isinstance(val, pd.DataFrame):
                    val = val.values
                else:
                    val = np.array(val.to_list())
                feed_dict[df_col_name] = tensorflow.constant(val)
        else:
            raise TypeError("Only dict and DataFrame input types are supported")

        raw_preds = self.infer(**feed_dict)
        pred_dict = {
            col_name: raw_preds[col_name].numpy() for col_name in raw_preds.keys()
        }
        for col in pred_dict.keys():
            # If the output tensor is not 1-dimensional
            # AND all elements have length of 1, flatten the array with `ravel()`
            if len(pred_dict[col].shape) != 1 and all(
                len(element) == 1 for element in pred_dict[col]
            ):
                pred_dict[col] = pred_dict[col].ravel()
            else:
                pred_dict[col] = pred_dict[col].tolist()

        if isinstance(data, dict):
            return pred_dict
        else:
            return pd.DataFrame.from_dict(data=pred_dict)
