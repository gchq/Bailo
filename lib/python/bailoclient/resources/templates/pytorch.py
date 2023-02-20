from .basemodel import BaseModel


class PyTorchModel(BaseModel):
    """
    Wrapper class that creates a predict function such that
    predict(data: pd.DataFrame) -> model's output as pd.DataFrame (pandas DataFrame)
    """

    def __init__(self, pytorch_model):
        self.pytorch_model = pytorch_model

    def predict(self, data, device="cpu"):
        import torch
        import pandas as pd
        import numpy as np

        if isinstance(data, pd.DataFrame):
            inp_data = data.values.astype(np.float32)
        elif isinstance(data, np.ndarray):
            inp_data = data
        elif isinstance(data, (list, dict)):
            raise TypeError(
                "The PyTorch flavor does not support List or Dict input types. "
                "Please use a pandas.DataFrame or a numpy.ndarray"
            )
        else:
            raise TypeError("Input data should be pandas.DataFrame or numpy.ndarray")

        self.pytorch_model.to(device)
        self.pytorch_model.eval()
        with torch.no_grad():
            input_tensor = torch.from_numpy(inp_data).to(device)
            preds = self.pytorch_model(input_tensor)
            if not isinstance(preds, torch.Tensor):
                raise TypeError(
                    "Expected PyTorch model to output a single output tensor, "
                    "but got output of type '{}'".format(type(preds))
                )
            if isinstance(data, pd.DataFrame):
                predicted = pd.DataFrame(preds.numpy())
                predicted.index = data.index
            else:
                predicted = preds.numpy()
            return predicted
