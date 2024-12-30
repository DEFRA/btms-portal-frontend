/**
 * Sets up the route used for the home page.
 * These routes are registered in src/plugins/router.js.
 */

export const home = {
  method: 'GET',
  path: '/',
  handler: (_request, h) => {
    return h.view('home', {
      pageTitle: 'Home',
      heading: 'Home'
    })
  }
}
