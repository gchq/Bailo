const convertNameToUrlFormat = (name: string): string => name.toLowerCase().replace(/ /g, '-')

export default convertNameToUrlFormat
