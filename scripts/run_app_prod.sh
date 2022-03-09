# This is needed if we're using self-signed certs for the registry  
update-ca-certificates

if [[ -z "${SCHEMA_SETUP_SCRIPT}" ]]; then
  echo "No schemas setup script set; You will have to add schemas after startup"
else
  pwd
  ls 
  ls server
  ls server/scripts
  echo "Running npx ts-node --project tsconfig.server.json $SCHEMA_SETUP_SCRIPT"
  npx ts-node --project tsconfig.server.json $SCHEMA_SETUP_SCRIPT
fi

echo "Running 'npm run start'"
npm run start
