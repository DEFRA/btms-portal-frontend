import { paths } from './route-constants.js'

export const accessibility = {
  method: 'GET',
  path: paths.ACCESSIBILITY,
  options: {
    auth: false
  },
  handler: (_, h) => {
    return h.view('accessibility')
  }
}
