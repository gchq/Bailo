const convertNameToUrlFormat = (name: string): string => name.toLowerCase().replace(/-/g, '').replace(/ /g, '-')

export default convertNameToUrlFormat
