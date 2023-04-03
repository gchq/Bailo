from .basemodel import BaseModel


class SpacyModel(BaseModel):
    def __init__(self, spacy_model):
        self.spacy_model = spacy_model

    def predict(self, dataframe):
        """
        Only works for predicting using text categorizer.
        Not suitable for other pipeline components (e.g: parser)
        :param dataframe: pandas dataframe containing texts to be categorized
                          expected shape is (n_rows,1 column)
        :return: dataframe with predictions
        """
        import pandas as pd

        if len(dataframe.columns) != 1:
            raise Exception("Shape of input dataframe must be (n_rows, 1column)")

        return pd.DataFrame(
            {
                "predictions": dataframe.iloc[:, 0].apply(
                    lambda text: self.spacy_model(text).cats
                )
            }
        )
