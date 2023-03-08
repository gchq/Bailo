from .basemodel import BaseModel


class CatboostModel(BaseModel):
    def __init__(self, cb_model):
        self.cb_model = cb_model

    def predict(self, dataframe):
        return self.cb_model.predict(dataframe)
