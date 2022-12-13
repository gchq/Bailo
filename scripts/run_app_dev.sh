# This is needed if we're using self-signed certs for the registry  
# You must have mounted your additional CA certs into /usr/local/share/ca-certificates/
update-ca-certificates

echo "Running 'npm install'"
npm install

if [[ -z "${SCHEMA_SETUP_SCRIPT}" ]]; then
  echo "No schemas setup script set; You will have to add schemas after startup"
else
  echo "Running npx ts-node --project tsconfig.server.json $SCHEMA_SETUP_SCRIPT"
  npx ts-node --project tsconfig.server.json $SCHEMA_SETUP_SCRIPT
fi
echo "Running 'npm run dev'"
npm run dev
