class _PyFuncModelWrapper:
    """
    Wrapper around Spark MLlib PipelineModel providing interface for scoring pandas DataFrame.
    """

    def __init__(self, spark, spark_model):
        self.spark = spark
        self.spark_model = spark_model

    def predict(self, pandas_df):
        """
        Generate predictions given input data in a pandas DataFrame.
        :param pandas_df: pandas DataFrame containing input data.
        :return: List with model predictions.
        """
        from pyspark.ml import PipelineModel

        spark_df = _find_and_set_features_col_as_vector_if_needed(
            self.spark.createDataFrame(pandas_df), self.spark_model
        )
        prediction_column = "prediction"
        if isinstance(self.spark_model, PipelineModel) and self.spark_model.stages[
            -1
        ].hasParam("outputCol"):
            from pyspark.sql import SparkSession

            spark = SparkSession.builder.getOrCreate()
            # do a transform with an empty input DataFrame
            # to get the schema of the transformed DataFrame
            transformed_df = self.spark_model.transform(
                spark.createDataFrame([], spark_df.schema)
            )
            # Ensure prediction column doesn't already exist
            if prediction_column not in transformed_df.columns:
                # make sure predict work by default for Transformers
                self.spark_model.stages[-1].setOutputCol(prediction_column)
        return [
            x.prediction
            for x in self.spark_model.transform(spark_df)
            .select(prediction_column)
            .collect()
        ]
