trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

rm -rf .next
npm run dev > /dev/null 2>&1 &
sleep 2
TIME="%e" time curl -s $1 > /dev/null



# Setup:

# docker compose stop frontend
# sudo rm -rf .next

# Usage:

# bash benchmark.sh http://localhost:3000/blank
# bash benchmark.sh http://localhost:3000/
# bash benchmark.sh http://localhost:3000/model/does-not-matter