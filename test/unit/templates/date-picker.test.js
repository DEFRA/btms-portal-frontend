import path from 'path'
import { fileURLToPath } from 'node:url'
import nunjucks from 'nunjucks'
import { load } from 'cheerio'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const env = nunjucks.configure(
  [
    path.normalize(path.resolve(dirname, '../../../node_modules/govuk-frontend/dist')),
    path.normalize(path.resolve(dirname, '../../../src/templates')),
    path.normalize(path.resolve(dirname, '../../../node_modules/@ministryofjustice/frontend'))
  ],
  { trimBlocks: true, lstripBlocks: true }
)

const renderDatePicker = (params) => {
  const rendered = env.renderString(
    `{% from "moj/components/date-picker/macro.njk" import mojDatePicker %}{{ mojDatePicker(params) }}`,
    { params }
  )
  return load(rendered)
}

describe('mojDatePicker template override', () => {
  test('renders without attributes by default', () => {
    const $ = renderDatePicker({ id: 'test-date', name: 'testDate', label: { text: 'Test date' } })
    const input = $('input.moj-js-datepicker-input')
    expect(input.length).toBe(1)
    expect(input.attr('readonly')).toBeUndefined()
  })

  test('passes attributes to the input element', () => {
    const $ = renderDatePicker({
      id: 'test-date',
      name: 'testDate',
      label: { text: 'Test date' },
      attributes: { readonly: '' }
    })
    const input = $('input.moj-js-datepicker-input')
    expect(input.length).toBe(1)
    expect(input.is('[readonly]')).toBe(true)
  })
})
