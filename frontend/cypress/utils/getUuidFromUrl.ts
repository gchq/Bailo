const getUuidFromUrl = (url: string): string => url.slice(url.lastIndexOf('/') + 1)

export default getUuidFromUrl
