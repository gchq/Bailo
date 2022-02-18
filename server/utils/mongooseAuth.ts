import { Schema, Document } from "mongoose"
import { castArray } from 'lodash'

import { Forbidden } from "./result"

async function hasPermission(schema: Schema, options: any, doc: Document, authFunc: Function) {
  if (options.dangerouslyOverrideAuth) {
    return true
  }

  console.log('found user', options.user)

  if (!options.user) {
    return false
  }

  return await authFunc(doc, options.user)
}

async function asyncFilter(arr, predicate) {
  const results = await Promise.all(arr.map(predicate))
  return arr.filter((_v, index) => results[index])
}

export default function createAuthPlugin(authFunc: Function) {
  return (schema: Schema) => {
    schema.post('findOne', function(docs, next) {
      const options = this.getOptions()

      console.log('called find / findOne')
    
      return []
    })
  }
}

// export default function createAuthPlugin(authFunc: Function) {
//   return (schema: Schema) => {
//     async function save(doc: Document, options: any, next: Function) {
//       if (!await hasPermission(schema, options, doc, authFunc)) {
//         next(Forbidden({}, "Unable to save document, invalid permissions"))
//       }

//       next()
//     }

//     schema.pre('save', function preSave(next, options) {
//       return save(this, options, next)
//     })

//     async function find(query: any, doc: Document | Array<Document>, next: Function) {
//       console.log('find func')
      
//       const isArray = Array.isArray(doc)
//       const docArray = castArray(doc)

//       const filteredArray = await asyncFilter(docArray, (doc) => {
//         return hasPermission(schema, query.options, doc, authFunc)
//       })

//       console.log(docArray, filteredArray)

//       next(null, isArray ? filteredArray : filteredArray[0])
//     }

//     schema.post('findOne', function(docs, next, a, b) {
//       const options = this.getOptions()

//       console.log('called find / findOne')
    
//       return next(undefined)
//     })

//     schema.post('findOne', function postFindOne(query, doc, next) {
//       console.log('post findOne called')

//       return find(this, doc, next);
//     });
//   }
// }