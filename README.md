# btms-portal-frontend

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_btms-portal-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_btms-portal-frontend)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_btms-portal-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_btms-portal-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_btms-portal-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_btms-portal-frontend)

The BTMS Portal Frontend provides search for DEFRA Import Notifications (IPAFFS) and HMRC Customs Declarations (CDS) showing the relationships between them.

- [Prerequisites](#prerequisites)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Authentication](#authentication)
  - [Update dependencies](#update-dependencies)
  - [Environment variables](#environment-variables)
  - [Formatting](#formatting)
    - [Windows Prettier issue](#windows-prettier-issue)
- [Server-side caching](#server-side-caching)
- [Redis](#redis)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Prerequisites

- [Node.js](http://nodejs.org/) `>= v22`
- [npm](https://nodejs.org/) `>= v10.5.1` (installed with Node.js)
- [Docker](https://www.docker.com/)

You may find it easier to manage Node.js versions using a version manager such as [nvm](https://github.com/creationix/nvm) or [n](https://www.npmjs.com/package/n). From within the project folder you can then either run `nvm use` or `n auto` to install the required version.

## Local development

### Setup

Install application dependencies:

```bash
npm install
```

### Development

To run the application in `development` mode run:

```bash
npm run dev
```

### Production

To mimic the application running in `production` mode locally run:

```bash
npm start
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json)
To view them in your command line run:

```bash
npm run
```

### Authentication

For local authentication, we use the [cdp-defra-id-stub](https://github.com/DEFRA/cdp-defra-id-stub). If you run this as within Docker you will also get an instance of Redis, which can be used for session caching. You should also delete the [reference to localstack](https://github.com/DEFRA/cdp-defra-id-stub/blob/main/compose.yml#L20-L21) within the stubs `compose.yml` file.

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Environment variables

For local development some environment variables can to be added to a `.env.local` file at the root of the project, (this will be ignored by Git). These will then be picked up by Convict in [src/config/config.js](src/config/config.js) when you start the app using `npm run dev`

#### Variables needed for local development

Ask a member of the team to provide you with values.

| name                                 | purpose                                                  |
| ------------------------------------ |----------------------------------------------------------|
| BTMS_API_BASE_URL                    | Search queries use this API for results                  |
| BTMS_API_USERNAME                    | Username for calls to search API                         |
| BTMS_API_PASSWORD                    | Password for calls to search API                         |
| BTMS_REPORTING_API_BASE_URL          | Reporting section use this API for reporting data        |
| BTMS_REPORTING_API_USERNAME          | Username for calls to reporting API                      |
| BTMS_REPORTING_API_PASSWORD          | Password for calls to reporting API                      |
| AUTH_DEFRA_ID_OIDC_CONFIGURATION_URL | Configuration URL for DefraId                            |
| AUTH_DEFRA_ID_CLIENT_SECRET          | Secret for DefraId                                       |
| AUTH_DEFRA_ID_ORGANISATIONS          | List of DefraId organisations with access to the service |
| AUTH_DEFRA_ID_ACCOUNT_MANAGEMENT_URL | DefraId (Gov Gateway) account management URL             |
| AUTH_ENTRA_ID_OIDC_CONFIGURATION_URL | Configuration URL for EntraId                            |
| AUTH_ENTRA_ID_CLIENT_ID              | Client ID for EntraId                                    |
| AUTH_ENTRA_ID_CLIENT_SECRET          | Secret for EntraId                                       |
| SESSION_CACHE_ENGINE                 | Location of session storage ('redis' or 'memory')        |
| IPAFFS_URL                           | URL for links out to IPAFFS from notifications           |
| TZ                                   | Europe/London                                            |

### Formatting

#### Windows Prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## Server-side caching

We use Catbox for server-side caching. By default the service will use CatboxRedis when deployed and CatboxMemory for
local development. You can override the default behaviour by setting the `SESSION_CACHE_ENGINE` environment variable to either `redis` or `memory`.

Please note: CatboxMemory (`memory`) is _not_ suitable for production use! The cache will not be shared between each instance of the service and it will not persist between restarts.

## Redis

Redis is an in-memory key-value store. Every instance of a service has access to the same Redis key-value store similar to how services might have a database (or MongoDB). All frontend services access Redis keys that are namespaced using the service name (e.g. `my-service:*`).

If your service does not require a session cache to be shared between instances or if you don't require Redis, you can
disable Redis be setting `SESSION_CACHE_ENGINE=memory`.

## Docker

### Development image

Build:

```bash
docker build --target development --no-cache --tag btms-portal-frontend:development .
```

Run:

```bash
docker run -p 3000:3000 btms-portal-frontend:development
```

### Production image

Build:

```bash
docker build --no-cache --tag btms-portal-frontend .
```

Run:

```bash
docker run -p 3000:3000 btms-portal-frontend
```

### Docker Compose

A local environment with:

- Localstack for AWS services (S3, SQS)
- Redis
- MongoDB
- This service
- A commented out backend example

```bash
docker compose up --build -d
```

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties).

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
