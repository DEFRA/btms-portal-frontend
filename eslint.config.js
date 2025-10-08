import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['node', 'jest'],
    ignores: neostandard.resolveIgnoresFromGitignore(),
    noStyle: true
  }),
  {
    files: ['src/client/javascripts/**/*.js'],
    rules: {
      'no-new': 'off'
    }
  }
]
