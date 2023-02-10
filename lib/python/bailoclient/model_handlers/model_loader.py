from bailoclient.utils.enums import ModelFlavour
from bailoclient.utils.exceptions import (
    ModelFlavourNotFound,
    ModelMethodNotAvailable,
)


class Loader:
    """Class for handling model loader functions"""

    model_loaders = {}

    def load_model(self, model_path: str, model_flavour: str):
        """Load a model

        Args:
            model_path (str): Path to the actual model file (e.g. './model.pth')
            model_flavour (str): Flavour of the model (e.g. 'torch')


        Raises:
            ModelFlavourNotRecognised: The provided model flavour isn't supported
            ModelMethodNotAvailable: The model flavour is supported but the loader function hasn't been implemented

        Returns:
            Model: The loaded model
        """

        if model_flavour not in ModelFlavour:
            raise ModelFlavourNotFound(
                f"The model flavour {model_flavour} was not found. It may be an unsupported model type."
            )

        try:
            loader_func = self.model_loaders[model_flavour]

        except KeyError:
            raise ModelMethodNotAvailable(
                "Model loader has not yet been implemented for this model type"
            ) from None

        return loader_func(model_path)
