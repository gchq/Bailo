from .basemodel import BaseModel


class ProphetModel(BaseModel):
    def __init__(self, pr_model):
        self.pr_model = pr_model

    def predict(self, dataframe):
        return self.pr_model.predict(dataframe)
