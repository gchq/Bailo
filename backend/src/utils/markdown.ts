import ts from 'typescript'

interface DocumentationNode {
  name: string
  doc: string
  type?: string
  children?: DocumentationNode[]
}

// If a type is an array or a mapping we should give the type of the element or key value
function convertType(tc: ts.TypeChecker, type: ts.Type): ts.Type {
  const keyValue = type.getStringIndexType()
  if (type.symbol?.name === 'Array') {
    const params = tc.getTypeArguments(type as ts.TypeReference)
    return params[0]
  } else if (keyValue !== undefined) {
    return keyValue
  } else {
    return type
  }
}

function buildTree() {
  // Compilation list the program will compile these files
  const program = ts.createProgram(['src/types/types.ts', 'src/utils/config.ts'], {
    target: ts.ScriptTarget.ESNext,
  })
  const checker = program.getTypeChecker()

  function generate(interfaceDecl: ts.Declaration, documentationNode: DocumentationNode[]) {
    interfaceDecl.forEachChild((member) => {
      if (ts.isPropertySignature(member) && member.type) {
        const name = member.name.getText()
        const type = checker.typeToString(checker.getTypeFromTypeNode(member.type))
        const doc = ts
          .getJSDocCommentsAndTags(member)
          .map((tag) => tag.comment)
          .filter(Boolean)
          .join(' ')
        if (!doc) {
          return
        }
        const symbol = convertType(checker, checker.getTypeFromTypeNode(member.type)).getSymbol()
        const node = { name, type, doc, children: [] }
        documentationNode.push(node)
        if (symbol && symbol.declarations) {
          for (const declaration of symbol.declarations) {
            generate(declaration, node.children)
          }
        }
      }
    })
    return documentationNode
  }

  const documentation: DocumentationNode[] = []
  const sourceFile = program.getSourceFile('src/utils/config.ts')
  if (sourceFile) {
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === 'Config') {
        generate(node, documentation)
      }
    })
  }
  return documentation
}

let cached: DocumentationNode[] | undefined

function buildTreeCached() {
  if (cached) {
    return cached
  }
  cached = buildTree()
  return cached
}

const markdownConfig = buildTreeCached()
export default markdownConfig
