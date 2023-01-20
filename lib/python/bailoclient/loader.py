class Loader:
    model_loaders = {}

    def load_model(self, model_flavour: str, model_path: str):
        return self.model_loaders[model_flavour](model_path)
