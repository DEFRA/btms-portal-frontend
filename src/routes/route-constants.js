const paths = {
  HEALTH: '/health',
  LANDING: '/',
  AUTH_DEFRA_ID_CALLBACK: '/signin-oidc',
  SIGN_IN: '/sign-in',
  SIGN_IN_ENTRA: '/signin-entra-id',
  SIGN_OUT: '/sign-out',
  SEARCH: '/search',
  SEARCH_RESULT: '/search-result'
}

const queryStringParams = {
  SEARCH_TERM: 'searchTerm'
}

const CACHE_CONTROL_NO_STORE = {
  privacy: 'default',
  otherwise: 'no-store'
}

export {
  paths,
  queryStringParams,
  CACHE_CONTROL_NO_STORE
}
