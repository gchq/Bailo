from .basemodel import BaseModel


class LGBModel(BaseModel):
    def __init__(self, lgb_model):
        self.lgb_model = lgb_model

    def predict(self, dataframe):
        return self.lgb_model.predict(dataframe)
