import convict from 'convict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const fourHoursMs = 14400000
const oneWeekMs = 604800000

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  appBaseUrl: {
    doc: 'Application base URL for after we signIn',
    format: String,
    default: 'http://localhost:3000',
    env: 'APP_BASE_URL'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3000,
    env: 'PORT'
  },
  staticCacheTimeout: {
    doc: 'Static cache timeout in milliseconds',
    format: Number,
    default: oneWeekMs,
    env: 'STATIC_CACHE_TIMEOUT'
  },
  serviceName: {
    doc: 'Applications Service Name',
    format: String,
    default: 'Border Trade Matching Service'
  },
  root: {
    doc: 'Project root',
    format: String,
    default: path.resolve(dirname, '../..')
  },
  assetPath: {
    doc: 'Asset path',
    format: String,
    default: '/public',
    env: 'ASSET_PATH'
  },
  isProduction: {
    doc: 'If this application running in the production environment',
    format: Boolean,
    default: isProduction
  },
  isDevelopment: {
    doc: 'If this application running in the development environment',
    format: Boolean,
    default: isDevelopment
  },
  isTest: {
    doc: 'If this application running in the test environment',
    format: Boolean,
    default: isTest
  },
  log: {
    enabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: process.env.NODE_ENV !== 'test',
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in.',
      format: ['ecs', 'pino-pretty'],
      default: isProduction ? 'ecs' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : [],
      env: 'LOG_REDACT'
    }
  },
  httpProxy: /** @type {SchemaObj<string | null>} */ ({
    doc: 'HTTP Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTP_PROXY'
  }),
  httpsProxy: /** @type {SchemaObj<string | null>} */ ({
    doc: 'HTTPS Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTPS_PROXY'
  }),
  isSecureContextEnabled: {
    doc: 'Enable Secure Context',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_SECURE_CONTEXT'
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  session: {
    cache: {
      engine: {
        doc: 'backend cache is written to',
        format: ['redis', 'memory'],
        default: isProduction ? 'redis' : 'memory',
        env: 'SESSION_CACHE_ENGINE'
      },
      name: {
        doc: 'server side session cache name',
        format: String,
        default: 'session',
        env: 'SESSION_CACHE_NAME'
      },
      ttl: {
        doc: 'server side session cache ttl',
        format: Number,
        default: fourHoursMs,
        env: 'SESSION_CACHE_TTL'
      }
    },
    cookie: {
      ttl: {
        doc: 'Session cookie ttl',
        format: Number,
        default: fourHoursMs,
        env: 'SESSION_COOKIE_TTL'
      },
      password: {
        doc: 'session cookie password',
        format: String,
        default: 'the-password-must-be-at-least-32-characters-long',
        env: 'SESSION_COOKIE_PASSWORD',
        sensitive: true
      },
      secure: {
        doc: 'set secure flag on cookie',
        format: Boolean,
        default: isProduction,
        env: 'SESSION_COOKIE_SECURE'
      }
    }
  },
  redis: /** @type {Schema<RedisConfig>} */ ({
    host: {
      doc: 'Redis cache host',
      format: String,
      default: '127.0.0.1',
      env: 'REDIS_HOST'
    },
    username: {
      doc: 'Redis cache username',
      format: String,
      default: '',
      env: 'REDIS_USERNAME'
    },
    password: {
      doc: 'Redis cache password',
      format: '*',
      default: '',
      sensitive: true,
      env: 'REDIS_PASSWORD'
    },
    keyPrefix: {
      doc: 'Redis cache key prefix name used to isolate the cached results across multiple clients',
      format: String,
      default: 'btms-portal-frontend:',
      env: 'REDIS_KEY_PREFIX'
    },
    useSingleInstanceCache: {
      doc: 'Connect to a single instance of redis instead of a cluster.',
      format: Boolean,
      default: !isProduction,
      env: 'USE_SINGLE_INSTANCE_CACHE'
    },
    useTLS: {
      doc: 'Connect to redis using TLS',
      format: Boolean,
      default: isProduction,
      env: 'REDIS_TLS'
    }
  }),
  nunjucks: {
    watch: {
      doc: 'Reload templates when they are changed.',
      format: Boolean,
      default: isDevelopment
    },
    noCache: {
      doc: 'Use a cache and recompile templates each time',
      format: Boolean,
      default: isDevelopment
    }
  },
  tracing: {
    header: {
      doc: 'Which header to track',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  },
  btmsApi: {
    baseUrl: {
      doc: 'BTMS (backend) API base URL.',
      format: String,
      default: 'http://localhost:9080/api',
      env: 'BTMS_API_BASE_URL'
    },
    username: {
      doc: 'BTMS (backend) API username for authentication.',
      format: String,
      default: '',
      env: 'BTMS_API_USERNAME'
    },
    password: {
      doc: 'BTMS (backend) API password for authentication.',
      format: String,
      default: '',
      env: 'BTMS_API_PASSWORD'
    }
  },
  btmsReportingApi: {
    baseUrl: {
      doc: 'BTMS Reporting API base URL.',
      format: String,
      default: 'http://localhost:9080/reporting-api',
      env: 'BTMS_REPORTING_API_BASE_URL'
    },
    username: {
      doc: 'BTMS Reporting API username for authentication.',
      format: String,
      default: '',
      env: 'BTMS_REPORTING_API_USERNAME'
    },
    password: {
      doc: 'BTMS Reporting API password for authentication.',
      format: String,
      default: '',
      env: 'BTMS_REPORTING_API_PASSWORD'
    }
  },
  btmsImportsProcessor: {
    baseUrl: {
      doc: 'Trade Imports Processor base URL.',
      format: String,
      default: 'http://localhost:9080/processor',
      env: 'BTMS_IMPORTS_PROCESSOR_BASE_URL'
    },
    username: {
      doc: 'Trade Imports Processor username for authentication.',
      format: String,
      default: '',
      env: 'BTMS_IMPORTS_PROCESSOR_USERNAME'
    },
    password: {
      doc: 'Trade Imports Processor password for authentication.',
      format: String,
      default: '',
      env: 'BTMS_IMPORTS_PROCESSOR_PASSWORD'
    }
  },
  auth: {
    defraId: {
      oidcConfigurationUrl: {
        doc: 'Defra ID OIDC configuration URL',
        format: String,
        env: 'AUTH_DEFRA_ID_OIDC_CONFIGURATION_URL',
        default:
          'https://dcidmtest.b2clogin.com/dcidmtest.onmicrosoft.com/b2c_1a_cui_signin_stub/.well-known/openid-configuration'
      },
      serviceId: {
        doc: 'Defra ID service ID',
        format: String,
        env: 'AUTH_DEFRA_ID_SERVICE_ID',
        default: 'd7d72b79-9c62-ee11-8df0-000d3adf7047'
      },
      clientId: {
        doc: 'Defra ID client ID',
        format: String,
        env: 'AUTH_DEFRA_ID_CLIENT_ID',
        default: '2fb0d715-affa-4bf1-836e-44a464e3fbea'
      },
      clientSecret: {
        doc: 'Defra ID client secret',
        format: String,
        sensitive: true,
        env: 'AUTH_DEFRA_ID_CLIENT_SECRET',
        default: ''
      },
      scopes: {
        doc: 'Defra ID scopes',
        format: Array,
        sensitive: true,
        env: 'AUTH_DEFRA_ID_SCOPES',
        default: ['openid', 'offline_access']
      },
      organisations: {
        doc: 'Defra ID allowed organisations',
        format: Array,
        sensitive: true,
        env: 'AUTH_DEFRA_ID_ORGANISATIONS',
        default: ['7f2f65e0-4858-11f0-afd0-f3af378128f9']
      },
      accountManagementUrl: {
        doc: 'Defra ID account management portal URL',
        format: String,
        env: 'AUTH_DEFRA_ID_ACCOUNT_MANAGEMENT_URL',
        default: '#'
      }
    },
    entraId: {
      oidcConfigurationUrl: {
        doc: 'Entra ID OIDC configuration URL',
        format: String,
        env: 'AUTH_ENTRA_ID_OIDC_CONFIGURATION_URL',
        default:
          'https://dcidmtest.b2clogin.com/dcidmtest.onmicrosoft.com/b2c_1a_cui_signin_stub/.well-known/openid-configuration'
      },
      clientId: {
        doc: 'ENTRA ID client ID',
        format: String,
        env: 'AUTH_ENTRA_ID_CLIENT_ID',
        default: '2fb0d715-affa-4bf1-836e-44a464e3fbea'
      },
      clientSecret: {
        doc: 'ENTRA ID client secret',
        format: String,
        sensitive: true,
        env: 'AUTH_ENTRA_ID_CLIENT_SECRET',
        default: ''
      },
      groups: {
        doc: 'ENTRA ID user groups',
        format: Array,
        sensitive: true,
        env: 'AUTH_ENTRA_ID_SECURITY_GROUPS',
        default: []
      },
      scopes: {
        doc: 'ENTRA ID scopes',
        format: Array,
        sensitive: true,
        env: 'AUTH_ENTRA_ID_SCOPES',
        default: ['openid', 'offline_access']
      },
      adminGroupId: {
        doc: 'ENTRA ID - admin security group identifier',
        format: String,
        sensitive: true,
        env: 'AUTH_ENTRA_ID_ADMIN_GROUP_ID',
        default: ''
      }
    },
    origins: {
      doc: 'Auth provider origins for CSP header',
      format: Array,
      default: []
    }
  },
  ipaffs: {
    urlTemplate: {
      doc: 'IPAFFS notifications URL template',
      format: String,
      default: '',
      env: 'IPAFFS_URL'
    }
  },
  gtmId: {
    doc: 'Google Tag Manager container identifier',
    format: String,
    default: 'GTM-PSCS57N9',
    env: 'GTM_ID'
  }
})

config.validate({ allowed: 'strict' })

export { config }
