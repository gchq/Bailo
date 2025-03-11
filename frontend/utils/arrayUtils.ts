import dayjs from 'dayjs'

export const sortByNameAscending = <T extends { name: string }>(a: T, b: T) => {
  return a.name.localeCompare(b.name)
}

export const sortByCreatedAtDescending = <T extends { createdAt: string | Date }>(a: T, b: T) => {
  if (!dayjs(a.createdAt).isValid() || !dayjs(b.createdAt).isValid()) {
    throw new Error('Invalid date provided to sortByCreatedByDescending')
  }

  return new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1
}

export const sortByCreatedAtAscending = <T extends { createdAt: string | Date }>(a: T, b: T) => {
  if (!dayjs(a.createdAt).isValid() || !dayjs(b.createdAt).isValid()) {
    throw new Error('Invalid date provided to sortByCreatedAtAscending')
  }

  return new Date(b.createdAt) > new Date(a.createdAt) ? -1 : 1
}
