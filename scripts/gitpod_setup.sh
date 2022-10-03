npm install
npm run certs
sed "s/user_id=REPLACE_WITH_UID/user_id=$UID/" docker-compose-dev.yml > docker-compose-dev-personal.yml
docker-compose -f docker-compose-dev-personal.yml pull