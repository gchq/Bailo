const { execSync } = require('child_process')

/**
 * Removes all untracked and ignored files/directories for paths populated by generate.js.
 * This resets the working tree to a clean state before or after regenerating assets.
 */
function run() {
  execSync(
    [
      'git clean -xfd', // -x: include ignored files, -f: force, -d: remove directories
      'src/Copyright.tsx',
      'src/Link.tsx',
      'src/docs',
      'src/common/Title.tsx',
      'pages/docs',
      'pages/accessibility',
      'public',
    ].join(' '),
    { stdio: 'inherit' },
  )
}

run()
