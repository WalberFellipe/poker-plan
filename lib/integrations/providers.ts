/**
 * Catálogo de provedores de board.
 *
 * Descreve o que cada integração é, quais escopos pede e se as credenciais
 * OAuth estão configuradas neste deploy — a interface usa isto para mostrar
 * "Conectar" ou explicar que o provedor está indisponível, em vez de oferecer
 * um botão que só levaria a um erro.
 */

export type ProviderId = "jira" | "trello" | "github" | "izzyplan";

export interface ProviderDescriptor {
  id: ProviderId;
  /** Monograma exibido no tile do card. */
  mark: string;
  scopes: string[];
  /** Nomes das variáveis de ambiente exigidas para o OAuth funcionar. */
  envVars: string[];
  /** Provedores sem implementação de OAuth aparecem sempre indisponíveis. */
  available: boolean;
}

export const PROVIDERS: ProviderDescriptor[] = [
  {
    id: "jira",
    mark: "JR",
    scopes: ["read:jira-work", "write:jira-work", "offline_access"],
    envVars: ["JIRA_CLIENT_ID", "JIRA_CLIENT_SECRET"],
    available: true,
  },
  {
    id: "izzyplan",
    mark: "IZ",
    scopes: [],
    envVars: [],
    // Conector interno sem API pública: não há OAuth para implementar.
    available: false,
  },
  {
    id: "trello",
    mark: "TR",
    scopes: ["read", "write"],
    envVars: ["TRELLO_API_KEY", "TRELLO_API_SECRET"],
    available: true,
  },
  {
    id: "github",
    mark: "GH",
    scopes: ["repo"],
    envVars: ["GITHUB_INTEGRATION_CLIENT_ID", "GITHUB_INTEGRATION_CLIENT_SECRET"],
    available: true,
  },
];

export function getProvider(id: string): ProviderDescriptor | undefined {
  return PROVIDERS.find((provider) => provider.id === id);
}

/** As credenciais deste provedor estão presentes no ambiente? */
export function isProviderConfigured(provider: ProviderDescriptor): boolean {
  if (!provider.available) return false;
  return provider.envVars.every((name) => Boolean(process.env[name]));
}

export interface ExternalIssue {
  externalId: string;
  key: string;
  title: string;
  type: string | null;
  url: string | null;
}
