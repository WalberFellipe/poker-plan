export interface SwaggerSpec {
  openapi: string
  info: {
    title: string
    version: string
    description: string
  }
  paths: {
    [path: string]: {
      get?: PathOperation
      post?: PathOperation
      put?: PathOperation
      delete?: PathOperation
      patch?: PathOperation
    }
  }
  components?: {
    schemas?: Record<string, SchemaObject>
    securitySchemes?: Record<string, SecurityScheme>
  }
}

interface PathOperation {
  summary?: string
  description?: string
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: {
    [statusCode: string]: Response
  }
  tags?: string[]
  security?: Array<Record<string, string[]>>
}

interface Parameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  description?: string
  required?: boolean
  schema: SchemaObject
}

interface RequestBody {
  description?: string
  content: {
    [mediaType: string]: {
      schema: SchemaObject
    }
  }
  required?: boolean
}

interface Response {
  description: string
  content?: {
    [mediaType: string]: {
      schema: SchemaObject
    }
  }
}

interface SchemaObject {
  type?: string
  properties?: Record<string, SchemaObject>
  items?: SchemaObject
  required?: string[]
  enum?: unknown[]
  nullable?: boolean
  description?: string
  format?: string
  default?: unknown
  example?: unknown
  oneOf?: SchemaObject[]
  allOf?: SchemaObject[]
  anyOf?: SchemaObject[]
}

interface SecurityScheme {
  type: string
  scheme?: string
  bearerFormat?: string
  flows?: {
    implicit?: OAuthFlow
    password?: OAuthFlow
    clientCredentials?: OAuthFlow
    authorizationCode?: OAuthFlow
  }
}

interface OAuthFlow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
} 