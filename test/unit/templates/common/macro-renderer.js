import { fileURLToPath } from 'node:url'
import path from 'path'
import nunjucks from 'nunjucks'
import { load } from 'cheerio'
import * as filters from '~/src/plugins/template-renderer/filters/filters.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const nunjucksTestEnv = nunjucks.configure(
  [
    '~/node_modules/govuk-frontend/dist/',
    path.normalize(path.resolve(dirname, '../../../../src/templates'))
  ],
  {
    trimBlocks: true,
    lstripBlocks: true
  }
)
Object.entries(filters).forEach(([name, filter]) => {
  nunjucksTestEnv.addFilter(name, filter)
})

/**
 * @param {string} componentName
 * @param {object} params
 * @param {string} [callBlock]
 */
export function renderMacro (componentName, params, callBlock) {
  const macroPath = `common/${componentName}/macro.njk`
  const macroName = `app${
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  }`
  const macroParams = JSON.stringify(params, null, 2)
  let macroString = `{%- from "${macroPath}" import ${macroName} -%}`

  if (callBlock) {
    macroString += `{%- call ${macroName}(${macroParams}) -%}${callBlock}{%- endcall -%}`
  } else {
    macroString += `{{- ${macroName}(${macroParams}) -}}`
  }

  return load(nunjucksTestEnv.renderString(macroString, {}))
}
