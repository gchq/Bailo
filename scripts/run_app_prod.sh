# This is needed if we're using self-signed certs for the registry  
update-ca-certificates

if [[ -z "${SCHEMA_SETUP_SCRIPT}" ]]; then
  echo "No schemas setup script set; You will have to add schemas after startup"
else
  echo "Running node $SCHEMA_SETUP_SCRIPT"
  node $SCHEMA_SETUP_SCRIPT
fi

echo "Running 'npm run start'"
#npm run start
NODE_ENV=production node dist/server/index.js
