async function getUserSession () {
  return this.state?.userSession?.sessionId
    ? this.server.app.cache.get(this.state.userSession.sessionId)
    : {}
}

export { getUserSession }
