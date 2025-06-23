import { checkOrganisation } from '../../../src/auth/check-organisation.js'
import { config } from '../../../src/config/config.js'

test('matches the current relationship', () => {
  const currentRelationshipId = 'rel-555'
  const organisationId = 'org-101'

  config.set(
    'auth.defraId.organisations',
    ['org-666', organisationId]
  )

  const relationships = [
    'not-this-one:org-666',
    `${currentRelationshipId}:${organisationId}`
  ]

  expect(() => checkOrganisation(currentRelationshipId, relationships))
    .not.toThrow()
})

test('no relationship match', () => {
  config.set(
    'auth.defraId.organisations',
    ['org-666']
  )

  const relationships = ['rel-100:org-666']

  expect(() => checkOrganisation('rel-555', relationships))
    .toThrow('organisation not allowed')
})

test('relationships as string from defra stub (local & dev)', () => {
  const currentRelationshipId = 'rel-555'
  const organisationId = 'org-101'

  config.set(
    'auth.defraId.organisations',
    ['org-666', organisationId]
  )

  const relationships =
    `not-this-one:org-666,${currentRelationshipId}:${organisationId}`

  expect(() => checkOrganisation(currentRelationshipId, relationships))
    .not.toThrow()
})
