## Generate a JWT for connecting to BAILO

In order to make REST requests to the API programatically, you'll need to supply a JWT in order for your request to be authenticated.

This python function will return a token to use as part of your request.

username = the username of the user object in AWS Cognito
password = the password of the user object
app_client_id = the App Client Id (can be found on AWS Cognito [select 'App clients' menu on the left of the Cognito page])
app_client_secret = the app client secret. This can be found on the same page above.

How to use:

```
python3 generate_jwt.py <username> <password> <app_client_id> <app_client_secret>
```

Please note that this functionality is a temporary solution to help provide tokens in order for programatic requests to the BAILO API.

Currently, the Gateway used to connect to BAILO is only directing traffic to the mlops-dev cluster.
