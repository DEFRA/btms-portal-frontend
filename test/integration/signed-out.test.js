import globalJsdom from 'global-jsdom'
import userEvent from '@testing-library/user-event'
import { getByRole } from '@testing-library/dom'
import { initialiseServer } from '../utils/initialise-server.js'
import { captureFormData } from '../utils/capture-form-data.js'
import { paths } from '../../src/routes/route-constants.js'

test('signed out', async () => {
  const server = await initialiseServer()
  const user = userEvent.setup()

  const { payload } = await server.inject({
    method: 'get',
    url: paths.SIGNED_OUT
  })

  globalJsdom(payload)
  const { formdata } = captureFormData()

  const entraRadio = getByRole(document.body, 'radio', {
    name: 'Defra Single Sign-on'
  })
  const defraRadio = getByRole(document.body, 'radio', {
    name: 'Government Gateway'
  })
  const submitButton = getByRole(document.body, 'button', {
    name: 'Sign in'
  })

  await user.click(entraRadio)
  await user.click(submitButton)
  expect(formdata()).toEqual({ authProvider: 'entraId' })

  await user.click(defraRadio)
  await user.click(submitButton)
  expect(formdata()).toEqual({ authProvider: 'defraId' })

  expect(document.title).toBe(
    'You are signed out - Border Trade Matching Service'
  )
})

test('signed out from entraId', async () => {
  const server = await initialiseServer()
  const user = userEvent.setup()

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SIGNED_OUT}?provider=entraId`
  })

  globalJsdom(payload)
  const { formdata } = captureFormData()

  const submitButton = getByRole(document.body, 'button', {
    name: 'Sign in'
  })
  await user.click(submitButton)
  expect(formdata()).toEqual({ authProvider: 'entraId' })
})

test('signed out from defraId', async () => {
  const server = await initialiseServer()
  const user = userEvent.setup()

  const { payload } = await server.inject({
    method: 'get',
    url: `${paths.SIGNED_OUT}?provider=defraId`
  })

  globalJsdom(payload)
  const { formdata } = captureFormData()

  const submitButton = getByRole(document.body, 'button', {
    name: 'Sign in'
  })
  await user.click(submitButton)
  expect(formdata()).toEqual({ authProvider: 'defraId' })
})
