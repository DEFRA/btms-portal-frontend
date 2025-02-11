import fetchMock from 'jest-fetch-mock'

global.fetch = fetchMock

process.env.BTMS_API_USERNAME='usr-name-for-unit-tests'
process.env.BTMS_API_PASSWORD='pwd-for-unit-tests'
process.env.BTMS_API_BASE_URL='https://btms-api-base-url-for-unit-tests/api'
