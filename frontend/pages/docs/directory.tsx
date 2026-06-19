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
  level?: number
}

export const flatDirectory: Array<DirectoryEntry> = [
  // Main Docs
  { title: 'Overview', slug: '', header: true },

  // Getting Started
  { title: 'Getting Started', slug: 'getting-started', header: true },
  { title: 'Quick Start Guide', slug: 'getting-started/quick-start' },
  { title: 'Core Concepts', slug: 'getting-started/core-concepts' },

  // Users
  { title: 'Users', slug: 'users', header: true },

  { title: 'Models', slug: 'users/models', header: true },
  { title: 'Creating a Model', slug: 'users/models/creating-a-model' },
  { title: 'Model Card', slug: 'users/models/model-card' },
  { title: 'Creating a Release', slug: 'users/models/creating-a-release' },
  { title: 'Uploading Files', slug: 'users/models/uploading-files' },
  { title: 'Uploading Images', slug: 'users/models/uploading-images' },
  { title: 'Model Templating', slug: 'users/models/model-templating' },

  { title: 'Data Cards', slug: 'users/data-cards', header: true },
  { title: 'Creating a Data Card', slug: 'users/data-cards/creating-a-data-card' },
  { title: 'Managing Data Cards', slug: 'users/data-cards/managing-data-cards' },

  { title: 'Using a Model', slug: 'users/using-a-model', header: true },
  { title: 'Browsing the Marketplace', slug: 'users/using-a-model/browsing-the-marketplace' },
  { title: 'Requesting Access', slug: 'users/using-a-model/requesting-access' },
  { title: 'Using a Pushed Docker Image', slug: 'users/using-a-model/using-a-pushed-docker-image' },
  { title: 'Downloading Files', slug: 'users/using-a-model/downloading-files' },

  { title: 'Reviews', slug: 'users/reviews', header: true },
  { title: 'Understanding Reviews', slug: 'users/reviews/understanding-reviews' },
  { title: 'Reviewing', slug: 'users/reviews/reviewing', header: true },
  { title: 'Reviewing a Release', slug: 'users/reviews/reviewing/releases' },
  { title: 'Reviewing an Access Request', slug: 'users/reviews/reviewing/access' },
  { title: 'Reviewing a Model Card Lifecycle', slug: 'users/reviews/reviewing/model-lifecycle' },
  { title: 'Review Outcomes', slug: 'users/reviews/review-outcomes' },

  { title: 'Security Scanning', slug: 'users/using-scanners', header: true },
  { title: 'File Scanning', slug: 'users/using-scanners/file-scanning' },
  { title: 'Image Scanning', slug: 'users/using-scanners/image-scanning' },

  { title: 'Inferencing', slug: 'users/inferencing', header: true },
  { title: 'Creating an Inference Service', slug: 'users/inferencing/creating-an-inference-service' },
  { title: 'Managing Inference Services', slug: 'users/inferencing/managing-inference-services' },

  { title: 'Model Mirroring', slug: 'users/model-mirroring', header: true },
  { title: 'Creating a Mirrored Model', slug: 'users/model-mirroring/creating-a-mirrored-model' },
  { title: 'Editing a Mirrored Model Card', slug: 'users/model-mirroring/editing-a-mirrored-model-card' },

  { title: 'Untrusted Models', slug: 'users/untrusted-models', header: true },
  { title: 'Untrusted Models', slug: 'users/untrusted-models/untrusted-models' },

  { title: 'Deletion', slug: 'users/deletion', header: true },
  { title: 'Deleting a File', slug: 'users/deletion/file-deletion' },
  { title: 'Deleting a Model', slug: 'users/deletion/model-deletion' },
  { title: 'Soft Deletion', slug: 'users/deletion/soft-deletion' },

  { title: 'Programmatic Access', slug: 'users/programmatically-using-bailo', header: true },
  { title: 'Authentication', slug: 'users/programmatically-using-bailo/authentication' },
  { title: 'Personal Access Tokens', slug: 'users/programmatically-using-bailo/personal-access-tokens' },
  { title: 'Python Client', slug: 'users/programmatically-using-bailo/python-client' },
  { title: 'OpenAPI Reference', slug: 'users/programmatically-using-bailo/open-api' },
  { title: 'Webhooks', slug: 'users/programmatically-using-bailo/webhooks' },

  // Administration
  { title: 'Administration', slug: 'administration', header: true },

  /// Getting Started
  { title: 'Getting Started', slug: 'administration/getting-started', header: true },
  { title: 'Deployment Architecture', slug: 'administration/getting-started/deployment-architecture' },
  { title: 'App Configuration', slug: 'administration/getting-started/app-configuration' },
  { title: 'Retention Configuration', slug: 'administration/getting-started/retention-configuration' },

  /// Schema Management
  { title: 'Schemas', slug: 'administration/schemas', header: true },
  { title: 'Understanding Schemas', slug: 'administration/schemas/understanding-schemas' },
  { title: 'Create a Schema', slug: 'administration/schemas/create-a-schema' },
  { title: 'Upload a Schema', slug: 'administration/schemas/upload-a-schema' },
  { title: 'Schema Migrations', slug: 'administration/schemas/schema-migrations' },

  /// Review Roles
  { title: 'Review Roles', slug: 'administration/review-roles', header: true },
  { title: 'Managing Review Roles', slug: 'administration/review-roles/managing-review-roles' },
  { title: 'Assigning Roles to Schemas', slug: 'administration/review-roles/assigning-roles-to-schemas' },

  /// Federation
  { title: 'Federation', slug: 'administration/federation', header: true },
  { title: 'Peer Integration', slug: 'administration/federation/peer-integration' },

  /// Microservices
  { title: 'Microservices', slug: 'administration/microservices', header: true },
  { title: 'Artefact Scanners', slug: 'administration/microservices/artefact-scanners' },

  /// Helm
  { title: 'Helm', slug: 'administration/helm', header: true },
  { title: 'Basic Usage', slug: 'administration/helm/basic-usage' },
  { title: 'Configuration', slug: 'administration/helm/configuration' },
  { title: 'Isolated Environments', slug: 'administration/helm/isolated-environments' },

  /// Migrations
  { title: 'Migrations', slug: 'administration/migrations', header: true },
  { title: 'Bailo v0.4', slug: 'administration/migrations/bailo-0.4' },
  { title: 'Bailo v2.0', slug: 'administration/migrations/bailo-2.0' },
  { title: 'DataBase Scripts', slug: 'administration/migrations/scripts' },

  // Reference
  { title: 'Reference', slug: 'reference', header: true },
  { title: 'Glossary', slug: 'reference/glossary' },
  { title: 'Roles & Permissions', slug: 'reference/roles-and-permissions' },
  { title: 'Troubleshooting & FAQ', slug: 'reference/troubleshooting' },
]

export interface DirectoryTree {
  slug: string
  title: string
  header?: boolean
  level: number
  children?: DirectoryTree[]
}

function slugsToTree(paths: Array<DirectoryEntry>) {
  const tree: DirectoryTree = {
    slug: '',
    title: 'Root',
    header: true,
    level: 0,
    children: [],
  }

  for (const path of paths) {
    const parts = path.slug.split('/')

    let leaf = tree
    let currentId = ''

    for (const part of parts) {
      const level = parts.indexOf(part) + 1
      const isLastPart = part === parts[parts.length - 1]
      const isFirstPart = part === parts[0]

      currentId += (isFirstPart ? '' : '/') + part

      let child = leaf.children?.find((node) => node.slug === currentId)

      if (!child) {
        if (!leaf.children) {
          leaf.children = []
        }

        leaf.children.push({
          slug: currentId,
          title: path.title,
          ...(path.header ? { header: true } : {}),
          level,
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
