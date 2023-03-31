import shelljs from 'shelljs'

const { exec } = shelljs

type RunCommandOptions = {
  silentErrors?: boolean
  hide?: boolean
}

export const runCommand = async (
  command: string,
  //   onStdout: (data: string) => void,
  //   onStderr: (data: string) => void,
  opts: RunCommandOptions = {}
) => {
  const childProcess = exec(command, { async: true, silent: true })
  //   childProcess.stdout?.on('data', (data) => {
  //     onStdout(data.trim())
  //   })

  //   childProcess.stderr?.on('data', (data) => {
  //     onStderr(data.trim())
  //   })

  await new Promise((resolve, reject) => {
    childProcess.on('exit', () => {
      if (childProcess.exitCode !== 0 && !opts.silentErrors) {
        reject(
          new Error(
            `Failed with status code '${childProcess.exitCode}'${opts.hide ? '' : ` when running '${command}'`}`
          )
        )
        return
      }

      resolve({})
    })
  })
}
