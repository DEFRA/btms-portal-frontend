const paths = {
  COOKIES: '/cookies',
  HEALTH: '/health',
  LANDING: '/',
  LATEST_ACTIVITY: '/latest-activity',
  ACCESSIBILITY: '/accessibility-statement',
  REPORTING: '/reporting',
  REPORTING_CSV: '/reporting/{name}',
  SIGN_IN: '/sign-in',
  SIGN_IN_CHOOSE: '/sign-in-choose',
  SIGN_IN_ENTRA: '/sign-in-entra',
  SIGN_OUT: '/sign-out',
  SIGNED_OUT: '/signed-out',
  SIGNIN_DEFRA_ID_CALLBACK: '/signin-oidc',
  SIGNIN_ENTRA_ID_CALLBACK: '/signin-entra-id',
  SEARCH: '/search',
  SEARCH_RESULT: '/search-result',
  GMR_RESULTS: '/gmr-results',
  CHROME_DEVTOOLS: '/.well-known/appspecific/com.chrome.devtools.json'
}

const queryStringParams = {
  SEARCH_TERM: 'searchTerm'
}

const CACHE_CONTROL_NO_STORE = {
  privacy: 'default',
  otherwise: 'no-store'
}

export const NO_MATCH_CSV = 'no-matches.csv'
export const MANUAL_RELEASE_CSV = 'manual-releases.csv'

export { paths, queryStringParams, CACHE_CONTROL_NO_STORE }
