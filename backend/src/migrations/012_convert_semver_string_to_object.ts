import Release from '../models/Release.js'

export async function up() {
  const releases = await Release.find({})
  for (const release of releases) {
    const semver = release['semver']
    if (semver !== undefined && typeof semver === typeof '') {
      release.set('semver', semver)
      await release.save()
    }
  }
}

export async function down() {
  /* NOOP */
}
