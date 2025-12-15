import { config } from '../config/config.js'
import boom from '@hapi/boom'
const entraIdSecurityGroups = config.get('auth.entraId.groups')
export const checkGroups = (groups) => {
  const isInEntraGroup = groups.some((group) => entraIdSecurityGroups.includes(group))

  if (!isInEntraGroup) {
    throw boom.forbidden('group not allowed')
  }
}
