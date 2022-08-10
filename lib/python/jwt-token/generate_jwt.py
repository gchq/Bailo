import sys
import hmac, hashlib, base64
import boto3

def generate_auth_token(username, password, app_client_id, key):
  message = bytes(username+app_client_id,'utf-8')
  key = bytes(key,'utf-8')
  secret_hash = base64.b64encode(hmac.new(key, message, digestmod=hashlib.sha256).digest()).decode()

  client = boto3.client('cognito-idp')
  token_result = client.initiate_auth(AuthFlow='USER_PASSWORD_AUTH', 
                      AuthParameters={'USERNAME': username, 'PASSWORD': password, 'SECRET_HASH': secret_hash},
                      ClientId=app_client_id)

  return token_result['AuthenticationResult']['AccessToken']


if __name__ == '__main__':
  token = generate_auth_token(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
  print(token)
