import joi from 'joi'
import { paths } from './route-constants.js'

export const signedOut = {
  method: 'get',
  path: paths.SIGNED_OUT,
  options: {
    validate: {
      query: joi.object({
        provider: joi.string()
      })
    }
  },
  handler: async (request, h) => {
    const { provider } = request.query
    return h.view('signed-out', { provider })
  }
}
