export default function TerminalLog({ logs, title }: { logs: any; title: any }) {
  return (
    <div className='react-terminal-wrapper' data-terminal-name={title}>
      <div className='react-terminal'>
        {logs.map((log: any, index: number) => (
          <span key={`line-${index}`} className='react-terminal-line'>
            {log.msg}
          </span>
        ))}
      </div>
    </div>
  )
}
