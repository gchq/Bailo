import Router from 'next/router'
import { useEffect } from 'react'

export default function RedirectDirectoryVisitor() {
  useEffect(() => {
    Router.push('/docs')
  }, [])
}

export interface DirectoryEntry {
  title: string
  slug: string
  header?: boolean
}

export const flatDirectory: Array<DirectoryEntry> = [
  // Main Docs
  { title: 'Docs', slug: '', header: true },

  // Users
  { title: 'Users', slug: 'users', header: true },

  { title: 'Upload a Model', slug: 'users/upload-a-model', header: true },
  { title: 'Why Upload A Model', slug: 'users/upload-a-model/why-upload-a-model' },
  { title: 'Requirements', slug: 'users/upload-a-model/requirements' },
  { title: 'Model Wrapper', slug: 'users/upload-a-model/model-wrapper' },
  { title: 'Preparing The Code', slug: 'users/upload-a-model/preparing-the-code' },
  { title: 'Upload To Bailo', slug: 'users/upload-a-model/upload-to-bailo' },
  { title: 'Updating A Model', slug: 'users/upload-a-model/updating-a-model' },

  { title: 'Deployments', slug: 'users/deployments', header: true },
  { title: 'Requesting A Deployment', slug: 'users/deployments/requesting-a-deployment' },
  { title: 'Compliance', slug: 'users/deployments/compliance' },
  { title: 'Using A Deployment', slug: 'users/deployments/using-a-deployment', header: true },
  { title: 'Docker', slug: 'users/deployments/using-a-deployment/docker' },

  { title: 'Approvals', slug: 'users/approvals' },

  { title: 'Automation', slug: 'users/automation', header: true },
  { title: 'Key Workflows', slug: 'users/automation/key-workflows' },
  { title: 'Python Client', slug: 'users/automation/python-client' },

  { title: 'Marketplace', slug: 'users/marketplace' },

  // Administration
  { title: 'Administration', slug: 'administration', header: true },

  { title: 'Getting Started', slug: 'administration/getting-started', header: true },
  { title: 'Building The Bailo Image', slug: 'administration/getting-started/building-the-bailo-image' },
  { title: 'Authentication', slug: 'administration/getting-started/authentication' },
  { title: 'Helm Deployments', slug: 'administration/getting-started/helm-deployments' },
  { title: 'Isolated Network Deployment', slug: 'administration/getting-started/isolated-network-deployment' },
  { title: 'Configuration', slug: 'administration/getting-started/configuration', header: true },
  { title: 'App Configuration', slug: 'administration/getting-started/configuration/app-configuration' },
  { title: 'Making A Schema', slug: 'administration/getting-started/configuration/making-a-schema' },

  { title: 'Migrations', slug: 'administration/migrations', header: true },
  { title: 'Bailo v0.4', slug: 'administration/migrations/bailo-0.4' },

  // Developers
  { title: 'Developers', slug: 'developers', header: true },
  { title: 'Contributing', slug: 'developers/contributing' },
  { title: 'Dev Setup', slug: 'developers/dev-setup' },

  { title: 'Main Concepts', slug: 'developers/main-concepts', header: true },
  { title: 'Logical Flow', slug: 'developers/main-concepts/logical-flow' },
  { title: 'Building Models', slug: 'developers/main-concepts/building-models' },

  { title: 'Processes', slug: 'developers/processes', header: true },
  { title: 'Adding An Endpoint', slug: 'developers/processes/adding-an-endpoint' },

  { title: 'Testing', slug: 'developers/testing', header: true },
  { title: 'Unit Testing', slug: 'developers/testing/unit-testing' },
  { title: 'E2e Testing', slug: 'developers/testing/e2e-testing' },
  { title: 'Manual Testing', slug: 'developers/testing/manual-testing' },

  { title: 'Useful Commands', slug: 'developers/useful-commands' },
  { title: 'Dev Notes', slug: 'developers/dev-notes' },

  // Errors
  { title: 'Common Errors', slug: 'errors', header: true },
  { title: 'Duplicate Version', slug: 'errors/duplicate-version' },

  // Markdown
  { title: 'Markdown Examples', slug: 'markdown-examples' },

  // V2
  { title: 'V2', slug: 'v2', header: true },
  { title: 'Model Images', slug: 'v2/model-images' },
]

export interface DirectoryTree {
  slug: string
  title: string
  header?: boolean
  children?: DirectoryTree[]
}

function slugsToTree(paths: Array<DirectoryEntry>) {
  const tree: DirectoryTree = {
    slug: '',
    title: 'Root',
    header: true,
    children: [],
  }

  for (const path of paths) {
    const parts = path.slug.split('/')

    let leaf = tree
    let currentId = ''

    for (const part of parts) {
      const isLastPart = part === parts[parts.length - 1]
      const isFirstPart = part === parts[0]

      currentId += (isFirstPart ? '' : '/') + part

      let child = leaf.children?.find((node) => node.slug === currentId)
      if (!child) {
        if (!leaf.children) leaf.children = []

        leaf.children.push({
          slug: currentId,
          title: path.title,
          ...(path.header ? { header: true } : {}),
          ...(isLastPart ? {} : { children: [] }),
        })

        child = leaf.children[leaf.children.length - 1]
      }

      leaf = child
    }
  }

  return tree
}

export const directory = slugsToTree(flatDirectory)
