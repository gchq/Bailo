const { rm } = require('shelljs')

async function run() {
  console.log(process.cwd())

  rm('-rf', 'pages/docs')
  rm('-rf', 'public')
  rm('-rf', 'src')
}

run()
