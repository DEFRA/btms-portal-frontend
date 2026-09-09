const defraIdSchema = {
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
  },
  jwksClientTimeout: {
    doc: 'Timeout in milliseconds before terminating call to JWKS URI',
    format: Number,
    env: 'AUTH_DEFRA_ID_JWKS_CLIENT_TIMEOUT',
    default: 10000
  }
}

const entraIdSchema = {
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
  },
  privateBetaGroupId: {
    doc: 'ENTRA ID - private beta security group identifier',
    format: String,
    sensitive: true,
    env: 'AUTH_ENTRA_ID_PRIVATE_BETA_GROUP_ID',
    default: 'NOT_CONFIGURED'
  },
  jwksClientTimeout: {
    doc: 'Timeout in milliseconds before terminating call to JWKS URI',
    format: Number,
    env: 'AUTH_ENTRA_ID_JWKS_CLIENT_TIMEOUT',
    default: 10000
  }
}

export const authSchema = {
  defraId: defraIdSchema,
  entraId: entraIdSchema,
  origins: {
    doc: 'Auth provider origins for CSP header',
    format: Array,
    default: []
  },
  feature: {
    levelMatchingReports: {
      allowedScopes: {
        doc: 'Allowed Security Groups for accessing Level Matching Reports',
        format: Array,
        sensitive: true,
        env: 'AUTH_FEATURE_LEVEL_MATCHING_REPORTS_ALLOWED_SCOPES',
        default: ['admin']
      }
    },
    levelNoMatchSearchResults: {
      allowedScopes: {
        doc: 'Allowed Security Groups which will see the Level No Match Warning Banner and the L2/L3 Results Tab on Search Results page',
        format: Array,
        sensitive: true,
        env: 'AUTH_FEATURE_LEVEL_NO_MATCH_SEARCH_RESULTS_ALLOWED_SCOPES',
        default: ['admin', 'private_beta']
      }
    }
  }
}