import wreck from '@hapi/wreck'

export const STATUS_CODES = {
  NOT_FOUND: 404
}

export const getWithErrorHandling = (token) => async (request, url) => {
  try {
    const { payload } = await wreck.get(url, {
      headers: { authorization: `Basic ${token}` },
      json: 'force'
    })

    return payload
  } catch (error) {
    if (error.output.statusCode !== STATUS_CODES.NOT_FOUND) {
      request.logger.setBindings({ error })
    }
    throw error
  }
}
