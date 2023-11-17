export default class EntityUtilsDefault {
  formatDisplayName(dn: string) {
    return dn.includes(':') ? dn.split(':')[1] : dn
  }
}
