from .basemodel import BaseModel


class StatsmodelsModel(BaseModel):
    def __init__(self, statsmodels_model):
        self.statsmodels_model = statsmodels_model

    def predict(self, dataframe):
        from statsmodels.tsa.base.tsa_model import TimeSeriesModel

        model = self.statsmodels_model.model
        if isinstance(model, TimeSeriesModel):
            # Assume the inference dataframe has columns "start" and "end", and just one row
            # TODO: move this to a specific mlflow.statsmodels.tsa flavor? Time series models
            # often expect slightly different arguments to make predictions
            if dataframe.shape[0] != 1 or not (
                "start" in dataframe.columns and "end" in dataframe.columns
            ):
                raise Exception(
                    "prediction dataframes for a TimeSeriesModel must have exactly one row"
                    + " and include columns called start and end"
                )

            start_date = dataframe["start"][0]
            end_date = dataframe["end"][0]
            return self.statsmodels_model.predict(start=start_date, end=end_date)
        else:
            return self.statsmodels_model.predict(dataframe)
