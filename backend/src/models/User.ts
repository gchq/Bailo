// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.

import { TokenDoc } from './Token.js'

export interface UserInterface {
  // Do not store user role information on this object.  This information
  // should be stored in an external corporate store.
  dn: string

  // A token may restrict the actions that a user currently is permitted to
  // complete.  If a token does not exist, full access is assumed.
  token?: TokenDoc
}
