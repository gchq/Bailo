# This is needed if we're using self-signed certs for the registry  
if [[ -z "${ADD_CA_CERT}" ]]; then
    echo "ADD_CA_CERT was not set; not adding anything to system CA"
else
    echo "Adding ${ADD_CA_CERT} to system CA"
    cp ${ADD_CA_CERT} /usr/local/share/ca-certificates/bailo.pem
    update-ca-certificates
fi

echo "Running 'npm run start'"
npm run start
