"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

interface OpenAPIInfo {
  title: string;
  version: string;
}

interface OpenAPIPath {
  [key: string]: {
    [method: string]: {
      summary?: string;
      description?: string;
      parameters?: Array<{
        name: string;
        in: string;
        required: boolean;
        type: string;
      }>;
      responses?: Record<string, { description: string }>;
    };
  };
}

interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  paths: OpenAPIPath;
}

export default function ApiDocs() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data: OpenAPISpec) => setSpec(data));
  }, []);

  if (!spec) {
    return <div>Carregando</div>;
  }

  return <SwaggerUI spec={spec} />;
}
