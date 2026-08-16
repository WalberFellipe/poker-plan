/**
 * Catálogo de provedores de board.
 *
 * Descreve o que cada integração é, como ela autentica e se as credenciais
 * estão configuradas neste deploy — a interface usa isto para escolher entre
 * mandar o usuário para um consentimento OAuth, pedir um token num formulário,
 * ou explicar que o provedor está indisponível.
 */

export type ProviderId = "jira" | "trello" | "github" | "izzyplan";

/**
 * Como o provedor autentica.
 * - `oauth`: redirect de consentimento e troca de código.
 * - `token`: a pessoa cola uma credencial que ela mesma gerou no provedor.
 */
export type AuthStyle = "oauth" | "token";

export interface ProviderDescriptor {
  id: ProviderId;
  /** Monograma exibido no tile do card. */
  mark: string;
  authStyle: AuthStyle;
  scopes: string[];
  /** Variáveis de ambiente exigidas. Vazio em provedores `token`. */
  envVars: string[];
  /**
   * Se dá para escrever os pontos de volta. A API pública do IzzyPlan é
   * somente leitura, então lá a estimativa fica só no nosso registro.
   */
  canPushPoints: boolean;
  available: boolean;
}

export const PROVIDERS: ProviderDescriptor[] = [
  {
    id: "jira",
    mark: "JR",
    authStyle: "oauth",
    scopes: ["read:jira-work", "write:jira-work", "offline_access"],
    envVars: ["JIRA_CLIENT_ID", "JIRA_CLIENT_SECRET"],
    canPushPoints: true,
    available: true,
  },
  {
    id: "izzyplan",
    mark: "IZ",
    authStyle: "token",
    scopes: [],
    // Nada de ambiente: a credencial é por usuário, gerada no próprio IzzyPlan.
    envVars: [],
    canPushPoints: false,
    available: true,
  },
  {
    id: "trello",
    mark: "TR",
    authStyle: "oauth",
    scopes: ["read", "write"],
    envVars: ["TRELLO_API_KEY", "TRELLO_API_SECRET"],
    canPushPoints: true,
    available: true,
  },
  {
    id: "github",
    mark: "GH",
    authStyle: "oauth",
    scopes: ["repo"],
    envVars: ["GITHUB_INTEGRATION_CLIENT_ID", "GITHUB_INTEGRATION_CLIENT_SECRET"],
    canPushPoints: true,
    available: true,
  },
];

export function getProvider(id: string): ProviderDescriptor | undefined {
  return PROVIDERS.find((provider) => provider.id === id);
}

/**
 * O provedor pode ser oferecido neste ambiente?
 *
 * Provedores `token` não dependem de nada no servidor — quem traz a credencial
 * é o usuário —, então estão sempre disponíveis.
 */
export function isProviderConfigured(provider: ProviderDescriptor): boolean {
  if (!provider.available) return false;
  if (provider.authStyle === "token") return true;
  return provider.envVars.every((name) => Boolean(process.env[name]));
}

export interface ExternalIssue {
  externalId: string;
  key: string;
  title: string;
  type: string | null;
  url: string | null;
}
