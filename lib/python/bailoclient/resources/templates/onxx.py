class _OnnxModelWrapper:
    def __init__(self, path, providers=None):
        import onnxruntime

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
