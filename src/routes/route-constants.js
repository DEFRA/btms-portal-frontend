const paths = {
  ACCESSIBILITY: '/accessibility-statement',
  ADMIN_SEARCH: '/admin/search',
  CHROME_DEVTOOLS: '/.well-known/appspecific/com.chrome.devtools.json',
  COOKIES: '/cookies',
  GMR_SEARCH_RESULT: '/gmr-search-result',
  HEALTH: '/health',
  LANDING: '/',
  LATEST_ACTIVITY: '/latest-activity',
  REPORTING: '/reporting',
  REPORTING_CSV: '/reporting/{name}',
  SEARCH: '/search',
  SEARCH_RESULT: '/search-result',
  SIGN_IN: '/sign-in',
  SIGN_IN_CHOOSE: '/sign-in-choose',
  SIGN_IN_ENTRA: '/sign-in-entra',
  SIGN_OUT: '/sign-out',
  SIGNED_OUT: '/signed-out',
  SIGNIN_DEFRA_ID_CALLBACK: '/signin-oidc',
  SIGNIN_ENTRA_ID_CALLBACK: '/signin-entra-id'
}

const queryStringParams = {
  RESOURCE_TYPE: 'resourceType',
  SEARCH_TERM: 'searchTerm',
  SEARCH_TYPE: 'searchType'
}

const CACHE_CONTROL_NO_STORE = {
  privacy: 'default',
  otherwise: 'no-store'
}

export const NO_MATCH_CSV = 'no-matches.csv'
export const MANUAL_RELEASE_CSV = 'manual-releases.csv'

export { paths, queryStringParams, CACHE_CONTROL_NO_STORE }
