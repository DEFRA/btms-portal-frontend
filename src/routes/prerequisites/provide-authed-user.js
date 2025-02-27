const provideAuthedUser = {
  method: async (request) => request.getUserSession(),
  assign: 'authedUser'
}

export { provideAuthedUser }
