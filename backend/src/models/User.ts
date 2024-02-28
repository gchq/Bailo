// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface UserInterface {
  // Do not store user role information on this object.  This information
  // should be stored in an external corporate store.
  dn: string
}
