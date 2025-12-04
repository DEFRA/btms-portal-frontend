/**
 * Orders the items with the item matching the searchTermMatcher first, and the remaining items in descending updated date order (most recently updated at the top)
 * @param searchTerm - The search term used on the Search page
 * @param searchTermMatcher - A function passed in to find the item that matches the searchTerm
 * @returns {(function(*, *): (number|*))|*}
 */
export const sortDescending = (searchTerm, searchTermMatcher) => {
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
