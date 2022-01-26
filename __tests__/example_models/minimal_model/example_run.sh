docker pull <model_identifier_from_registry>
 
# View available Docker images (do this to find the Image_ID for the next command)
docker images
 
# Run Docker image
docker run -p 9999:9000 <Image_ID> #9000 in container, but map to 9999 on host (or any other unused port) 
 
# Check that the Docker container is running
docker ps
 
# Test the model
curl http://localhost:9999/predict -d 'json={"jsonData":{"data":["should be returned backwards"]}}'
# expect response of {"data":{"names":[],"ndarray":["sdrawkcab denruter eb dluohs"]},"meta":{}}
 
