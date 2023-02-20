from .basemodel import BaseModel


class XGBModel(BaseModel):
    def __init__(self, xgb_model):
        self.xgb_model = xgb_model

    def predict(self, dataframe):
        import xgboost as xgb

        if isinstance(self.xgb_model, xgb.Booster):
            return self.xgb_model.predict(xgb.DMatrix(dataframe))
        else:
            return self.xgb_model.predict(dataframe)
