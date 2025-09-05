import { CACHE_CONTROL_NO_STORE } from './route-constants.js'

export const loggedIn = {
  options: {
    auth: 'session',
    cache: CACHE_CONTROL_NO_STORE
  }
}
