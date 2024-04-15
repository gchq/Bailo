export const downloadFile = (text: string, name: string) => {
  const anchor = document.createElement('a')
  const type = name.split('.').pop()
  anchor.href = URL.createObjectURL(new Blob([text], { type: `text/${type === 'txt' ? 'plain' : type}` }))
  anchor.download = name
  anchor.click()
}
