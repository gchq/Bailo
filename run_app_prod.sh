# This is needed if we're using self-signed certs for the registry  
update-ca-certificates

echo "Running 'npm run start'"
npm run start
