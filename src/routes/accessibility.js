import { paths } from './route-constants.js'

export const accessibility = {
  method: 'GET',
  path: paths.ACCESSIBILITY,
  handler: (_, h) => {
    return h.view('accessibility')
  }
}
