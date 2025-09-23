import { Readable } from 'node:stream'

export const dataStream = (data) => {
  const str = JSON.stringify(data)

  const stream = new Readable()
  stream.push(str)
  stream.push(null)

  return stream
}
