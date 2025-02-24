'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocs() {
  const [spec, setSpec] = useState<any>(null)

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(setSpec)
  }, [])

  if (!spec) {
    return <div>Carregando...</div>
  }

  return <SwaggerUI spec={spec} />
} 