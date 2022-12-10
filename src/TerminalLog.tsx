export default function TerminalLog({ logs, title }: { logs: any; title: any }) {
  return (
    <div className='react-terminal-wrapper' data-terminal-name={title}>
      <div className='react-terminal' data-test='terminalLog'>
        {logs.map((log: any, index: number) => (
          // terminal will always only add lines to end, so key is
          // eslint-disable-next-line react/no-array-index-key
          <span key={`line-${index}`} className='react-terminal-line'>
            {log.msg}
          </span>
        ))}
      </div>
    </div>
  )
}
