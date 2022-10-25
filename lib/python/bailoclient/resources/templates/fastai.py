class _FastaiModelWrapper:
    def __init__(self, learner):
        self.learner = learner

    def predict(self, dataframe):
        dl = self.learner.dls.test_dl(dataframe)
        preds, _ = self.learner.get_preds(dl=dl)
        return pd.Series(map(np.array, preds.numpy())).to_frame("predictions")
