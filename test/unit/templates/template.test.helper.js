import { fileURLToPath } from 'node:url'
import path from 'path'
import nunjucks from 'nunjucks'
import { load } from 'cheerio'
import { context } from '../../../src/plugins/template-renderer/context.js'
import * as filters from '../../../src/plugins/template-renderer/filters/filters.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const nunjucksTestEnv = nunjucks.configure(
  [
    path.normalize(path.resolve(dirname, '../../../node_modules/govuk-frontend/dist')),
    path.normalize(path.resolve(dirname, '../../../src/templates'))
  ],
  {
    trimBlocks: true,
    lstripBlocks: true
  }
)

nunjucksTestEnv.addGlobal('getAssetPath', context({}).getAssetPath)

Object.entries(filters).forEach(([name, filter]) => {
  nunjucksTestEnv.addFilter(name, filter)
})

const renderTemplate = (template, viewContext) => {
  return load(nunjucksTestEnv.render(template, viewContext))
}

export {
  renderTemplate
}
