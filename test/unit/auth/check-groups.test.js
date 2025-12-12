import { checkGroups } from '../../../src/auth/check-groups'

test('groups match', () => {
  expect(() => checkGroups(['test-group-id'])).not.toThrow()
})

test('groups do not match', () => {
  expect(() => checkGroups(['12345'])).toThrow('group not allowed')
})
