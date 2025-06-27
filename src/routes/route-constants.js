const paths = {
  HEALTH: '/health',
  LANDING: '/',
  AUTH_DEFRA_ID_CALLBACK: '/signin-oidc',
  SIGN_IN: '/sign-in',
  SIGN_IN_ENTRA: '/sign-in-entra',
  SIGN_OUT: '/sign-out',
  SIGNED_OUT: '/signed-out',
  SIGNIN_ENTRA_ID_CALLBACK: '/signin-entra-id',
  SEARCH: '/search',
  SEARCH_RESULT: '/search-result',
  CHROME_DEVTOOLS: '/.well-known/appspecific/com.chrome.devtools.json'
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
