import ModelModel, { CollaboratorEntry } from '../models/Model.js'

export async function up() {
  const entries = await ModelModel.find({})

  for (const entry of entries) {
    const updatedCollaborators = entry.collaborators.reduce<CollaboratorEntry[]>(
      (fixedCollaborators, collaboratorA) => {
        // Only process this collaborator if we haven't already confirmed it's valid or fixed it
        if (fixedCollaborators.some((fixedCol) => fixedCol.entity === collaboratorA.entity)) {
          return fixedCollaborators
        }

        // Group all collaborators that share this entity string
        const collaboratorFragments = entry.collaborators.filter(
          (collaboratorB) => collaboratorA.entity === collaboratorB.entity,
        )

        // If the same entity is found in multiple collaborators, it's a duplicate
        if (collaboratorFragments.length > 1) {
          const fixedCollaborator: CollaboratorEntry = {
            entity: collaboratorA.entity,
            // Combine and de-duplicate all of the roles for this entity
            roles: [...new Set(collaboratorFragments.map((fragment) => fragment.roles).flat())],
          }
          fixedCollaborators.push(fixedCollaborator)
        } else {
          // This collaborator doesn't have any duplicates so treat it as "fixed"
          fixedCollaborators.push(collaboratorA)
        }

        return fixedCollaborators
      },
      [],
    )

    // If the arrays differ in length we know we've fixed some duplicates
    if (updatedCollaborators.length !== entry.collaborators.length) {
      await ModelModel.findByIdAndUpdate(entry._id, { collaborators: updatedCollaborators })
    }
  }
}

export async function down() {
  /* NOOP */
}
