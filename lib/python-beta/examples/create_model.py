from __future__ import annotations

from bailo import BailoClient, ModelVisibility

client = BailoClient(url="http://localhost:8080")

client.create_model(name="Yolo", description="You only look once", visibility=ModelVisibility.Public)

print(client.find_models())
