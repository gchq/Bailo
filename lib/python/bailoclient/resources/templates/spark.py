from .basemodel import BaseModel


class SparkModel(BaseModel):
    """
    Wrapper around Spark MLlib PipelineModel providing interface for scoring pandas DataFrame.
    """

    def __init__(self, spark, spark_model):
        self.spark = spark
        self.spark_model = spark_model

    @staticmethod
    def _find_and_set_features_col_as_vector_if_needed(self, spark_df, spark_model):
        """
        Finds the `featuresCol` column in spark_model and
        then tries to cast that column to `vector` type.
        This method is noop if the `featuresCol` is already of type `vector`
        or if it can't be cast to `vector` type
        Note:
        If a spark ML pipeline contains a single Estimator stage, it requires
        the input dataframe to contain features column of vector type.
        But the autologging for pyspark ML casts vector column to array<double> type
        for parity with the pd Dataframe. The following fix is required, which transforms
        that features column back to vector type so that the pipeline stages can correctly work.
        A valid scenario is if the auto-logged input example is directly used
        for prediction, which would otherwise fail without this transformation.

        :param spark_df: Input dataframe that contains `featuresCol`
        :param spark_model: A pipeline model or a single transformer that contains `featuresCol` param
        :return: A spark dataframe that contains features column of `vector` type.
        """
        from pyspark.sql.functions import udf
        from pyspark.ml.linalg import Vectors, VectorUDT
        from pyspark.sql import types as t

        def _find_stage_with_features_col(stage):
            if stage.hasParam("featuresCol"):

                def _array_to_vector(input_array):
                    return Vectors.dense(input_array)

                array_to_vector_udf = udf(f=_array_to_vector, returnType=VectorUDT())
                features_col_name = stage.extractParamMap().get(stage.featuresCol)
                features_col_type = [
                    _field
                    for _field in spark_df.schema.fields
                    if _field.name == features_col_name
                    and _field.dataType
                    in [
                        t.ArrayType(t.DoubleType(), True),
                        t.ArrayType(t.DoubleType(), False),
                    ]
                ]
                if len(features_col_type) == 1:
                    return spark_df.withColumn(
                        features_col_name, array_to_vector_udf(features_col_name)
                    )
            return spark_df

        if hasattr(spark_model, "stages"):
            for stage in reversed(spark_model.stages):
                return _find_stage_with_features_col(stage)
        return _find_stage_with_features_col(spark_model)

    def predict(self, pandas_df):
        """
        Generate predictions given input data in a pandas DataFrame.
        :param pandas_df: pandas DataFrame containing input data.
        :return: List with model predictions.
        """
        from pyspark.ml import PipelineModel

        spark_df = self._find_and_set_features_col_as_vector_if_needed(
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
