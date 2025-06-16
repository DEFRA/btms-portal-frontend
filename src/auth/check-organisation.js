import { config } from '../config/config.js'

const handleStubRelationshipsStrings = (relationships) => Array
  .isArray(relationships)
  ? relationships
  : relationships.split(',')

export const checkOrganisation = (currentRelationshipId, relationships) => {
  const { organisations } = config.get('auth.defraId')
  const relationshipsArray = handleStubRelationshipsStrings(relationships)

  const organisationId = relationshipsArray.reduce((matchedOrgId, relationship) => {
    const [relationshipId, orgId] = relationship.split(':')
    return (relationshipId === currentRelationshipId)
      ? orgId
      : matchedOrgId
  }, null)

  return organisations.includes(organisationId)
}
