export const sortDescendingAndSearchTermMatchAlwaysFirst = (searchTerm, searchTermMatcher) => {
  return (a, b) => {
    const aMatches = searchTermMatcher(searchTerm, a)
    const bMatches = searchTermMatcher(searchTerm, b)

    if (aMatches && !bMatches) { return -1 }
    if (bMatches && !aMatches) { return 1 }

    const aUpdated = new Date(a.updated).getTime()
    const bUpdated = new Date(b.updated).getTime()

    return bUpdated - aUpdated
  }
}
