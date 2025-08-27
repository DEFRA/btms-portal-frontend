import neostandard from 'neostandard'

export default neostandard({
  env: ['node', 'jest'],
  ignores: neostandard.resolveIgnoresFromGitignore(),
  noStyle: true
})
