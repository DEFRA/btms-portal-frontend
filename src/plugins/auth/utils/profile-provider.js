import jwt from '@hapi/jwt'

export async function supplyProfileFunc (oidcConfiguration) {
  async function populateProfile (credentials, params, _get) {
    if (!credentials?.token) {
      throw new Error(
        'Defra ID Auth Access Token not present. Unable to retrieve profile.')
    }

    const payload = jwt.token.decode(credentials.token).decoded.payload
    const displayName = [payload.firstName, payload.lastName]
      .filter((part) => part)
      .join(' ')

    credentials.profile = {
      id: payload.sub,
      correlationId: payload.correlationId,
      sessionId: payload.sessionId,
      contactId: payload.contactId,
      serviceId: payload.serviceId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      displayName,
      email: payload.email,
      uniqueReference: payload.uniqueReference,
      loa: payload.loa,
      aal: payload.aal,
      enrolmentCount: payload.enrolmentCount,
      enrolmentRequestCount: payload.enrolmentRequestCount,
      currentRelationshipId: payload.currentRelationshipId,
      relationships: payload.relationships,
      roles: payload.roles,
      idToken: params.id_token,
      tokenUrl: oidcConfiguration.token_endpoint,
      logoutUrl: oidcConfiguration.end_session_endpoint
    }
  }

  return populateProfile
}
