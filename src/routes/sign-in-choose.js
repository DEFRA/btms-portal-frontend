import joi from 'joi'
import { paths } from './route-constants.js'

export const signInChoose = [
  {
    method: 'get',
    path: paths.SIGN_IN_CHOOSE,
    handler: async (request, h) => {
      const [error] = request.yar.flash('signInError')
      const LegendIsPageHeading = true
      return h.view('sign-in-choose', { error, LegendIsPageHeading })
    }
  },
  {
    method: 'post',
    path: paths.SIGN_IN_CHOOSE,
    options: {
      validate: {
        payload: joi.object({
          authProvider: joi.string().required()
        }),
        failAction: (request, h) => {
          request.yar.flash('signInError', true)

          return h.redirect(paths.SIGN_IN_CHOOSE).takeover()
        }
      }
    },
    handler: async (request, h) => {
      const routes = {
        defraId: paths.SIGN_IN,
        entraId: paths.SIGN_IN_ENTRA
      }

      return h.redirect(routes[request.payload.authProvider])
    }
  }
]
