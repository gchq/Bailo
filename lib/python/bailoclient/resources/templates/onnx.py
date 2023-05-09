from .basemodel import BaseModel


FLAVOR_NAME = "onnx"
ONNX_EXECUTION_PROVIDERS = ["CUDAExecutionProvider", "CPUExecutionProvider"]


class OnnxModel(BaseModel):
    def __init__(self, path):
        import onnxruntime
        import os
        import numpy as np
        from pathlib import Path
        from mlflow.models import Model
        from mlflow.models.model import MLMODEL_FILE_NAME

        # Get the model meta data from the MLModel yaml file which may contain the providers
        # specification.
        local_path = str(Path(path).parent)
        model_meta = Model.load(os.path.join(local_path, MLMODEL_FILE_NAME))

        # Check if the MLModel config has the providers meta data
        if "providers" in model_meta.flavors.get(FLAVOR_NAME).keys():
            providers = model_meta.flavors.get(FLAVOR_NAME)["providers"]
        # If not, then default to the predefined list.
        else:
            providers = ONNX_EXECUTION_PROVIDERS

        # NOTE: Some distributions of onnxruntime require the specification of the providers
        # argument on calling. E.g. onnxruntime-gpu. The package import call does not differentiate
        #  which architecture specific version has been installed, as all are imported with
        # onnxruntime. onnxruntime documentation says that from v1.9.0 some distributions require
        #  the providers list to be provided on calling an InferenceSession. Therefore the try
        #  catch structure below attempts to create an inference session with just the model path
        #  as pre v1.9.0. If that fails, it will use the providers list call.
        # At the moment this is just CUDA and CPU, and probably should be expanded.
        # A method of user customization has been provided by adding a variable in the save_model()
        # function, which allows the ability to pass the list of execution providers via a
        # optional argument e.g.
        #
        # mlflow.onnx.save_model(..., providers=['CUDAExecutionProvider'...])
        #
        # For details of the execution providers construct of onnxruntime, see:
        # https://onnxruntime.ai/docs/execution-providers/
        #
        # For a information on how execution providers are used with onnxruntime InferenceSession,
        # see the API page below:
        # https://onnxruntime.ai/docs/api/python/api_summary.html#id8
        #

        try:
            self.rt = onnxruntime.InferenceSession(path)
        except ValueError:
            self.rt = onnxruntime.InferenceSession(path, providers=providers)

        assert len(self.rt.get_inputs()) >= 1
        self.inputs = [(inp.name, inp.type) for inp in self.rt.get_inputs()]
        self.output_names = [outp.name for outp in self.rt.get_outputs()]

    def _cast_float64_to_float32(self, feeds):
        for input_name, input_type in self.inputs:
            if input_type == "tensor(float)":
                feed = feeds.get(input_name)
                if feed is not None and feed.dtype == np.float64:
                    feeds[input_name] = feed.astype(np.float32)
        return feeds

    def predict(self, data):
        """

        Args:
            data: Either a pandas DataFrame, numpy.ndarray or a dictionary.

                     Dictionary input is expected to be a valid ONNX model feed dictionary.

                     Numpy array input is supported iff the model has a single tensor input and is
                     converted into an ONNX feed dictionary with the appropriate key.

                     Pandas DataFrame is converted to ONNX inputs as follows:
                        - If the underlying ONNX model only defines a *single* input tensor, the
                          DataFrame's values are converted to a NumPy array representation using the
                         `DataFrame.values()
                         <https://pandas.pydata.org/pandas-docs/stable/reference/api/
                          pandas.DataFrame.values.html#pandas.DataFrame.values>`_ method.
                        - If the underlying ONNX model defines *multiple* input tensors, each column
                          of the DataFrame is converted to a NumPy array representation.

                      For more information about the ONNX Runtime, see
                      `<https://github.com/microsoft/onnxruntime>`_.
        Returns:
            Model predictions. If the input is a pandas.DataFrame, the predictions are returned
                 in a pandas.DataFrame. If the input is a numpy array or a dictionary the
                 predictions are returned in a dictionary.
        """
        import numpy as np
        import pandas as pd

        if isinstance(data, dict):
            feed_dict = data
        elif isinstance(data, np.ndarray):
            # NB: We do allow scoring with a single tensor (ndarray) in order to be compatible with
            # supported pyfunc inputs iff the model has a single input. The passed tensor is
            # assumed to be the first input.
            if len(self.inputs) != 1:
                inputs = [x[0] for x in self.inputs]
                raise Exception(
                    "Unable to map numpy array input to the expected model "
                    "input. "
                    "Numpy arrays can only be used as input for MLflow ONNX "
                    "models that have a single input. This model requires "
                    "{} inputs. Please pass in data as either a "
                    "dictionary or a DataFrame with the following tensors"
                    ": {}.".format(len(self.inputs), inputs)
                )
            feed_dict = {self.inputs[0][0]: data}
        elif isinstance(data, pd.DataFrame):
            if len(self.inputs) > 1:
                feed_dict = {name: data[name].values for (name, _) in self.inputs}
            else:
                feed_dict = {self.inputs[0][0]: data.values}

        else:
            raise TypeError(
                "Input should be a dictionary or a numpy array or a pandas.DataFrame, "
                "got '{}'".format(type(data))
            )

        # ONNXRuntime throws the following exception for some operators when the input
        # contains float64 values. Unfortunately, even if the original user-supplied input
        # did not contain float64 values, the serialization/deserialization between the
        # client and the scoring server can introduce 64-bit floats. This is being tracked in
        # https://github.com/mlflow/mlflow/issues/1286. Meanwhile, we explicitly cast the input to
        # 32-bit floats when needed. TODO: Remove explicit casting when issue #1286 is fixed.
        feed_dict = self._cast_float64_to_float32(feed_dict)
        predicted = self.rt.run(self.output_names, feed_dict)

        if isinstance(data, pd.DataFrame):

            def format_output(data):
                # Output can be list and it should be converted to a numpy array
                # https://github.com/mlflow/mlflow/issues/2499
                data = np.asarray(data)
                return data.reshape(-1)

            response = pd.DataFrame.from_dict(
                {c: format_output(p) for (c, p) in zip(self.output_names, predicted)}
            )
            return response
        else:
            return dict(zip(self.output_names, predicted))
