import { config } from '../config/config.js'
import boom from '@hapi/boom'

export const checkGroups = (groups) => {
  const { entraId } = config.get('auth')

  const isInEntraGroup = groups.some((group) => entraId.groups.includes(group))

  if (!isInEntraGroup) {
    throw boom.forbidden('group not allowed')
  }
}
