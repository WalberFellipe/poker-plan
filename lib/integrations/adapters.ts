import type { Integration } from "@prisma/client";
import { decryptToken } from "@/lib/integrations/crypto";
import type { ExternalIssue, ProviderId } from "@/lib/integrations/providers";

/**
 * Adaptadores de board.
 *
 * Cada provedor implementa três coisas: trocar o `code` do OAuth por um token,
 * listar os boards disponíveis e listar as issues do board escolhido — mais a
 * escrita dos pontos de volta quando a estimativa fecha.
 */

export interface TokenResult {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scope?: string | null;
  workspace?: string | null;
  workspaceId?: string | null;
}

export interface Board {
  id: string;
  name: string;
}

export interface ProviderAdapter {
  /** URL de autorização para onde mandamos o usuário. Só em provedores OAuth. */
  authorizeUrl?(redirectUri: string, state: string): string;
  /** Troca o `code` recebido no callback por um access token. Só em OAuth. */
  exchangeCode?(code: string, redirectUri: string): Promise<TokenResult>;
  /**
   * Valida uma credencial colada pelo usuário e a transforma num TokenResult.
   * Só em provedores `token`. Deve lançar se a credencial não funcionar — é o
   * que impede guardar um token inválido e só descobrir na hora de importar.
   */
  connectWithToken?(token: string): Promise<TokenResult>;
  /** Boards/projetos/repositórios que o token consegue enxergar. */
  listBoards(integration: Integration): Promise<Board[]>;
  /** Issues abertas do board escolhido. */
  listIssues(integration: Integration): Promise<ExternalIssue[]>;
  /** Escreve a estimativa de volta. Ausente onde a API é somente leitura. */
  pushPoints?(
    integration: Integration,
    externalId: string,
    points: string
  ): Promise<void>;
}

function token(integration: Integration) {
  return decryptToken(integration.accessToken);
}

async function expectOk(response: Response, context: string) {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `${context}: ${response.status} ${response.statusText} ${body.slice(0, 200)}`
    );
  }
  return response;
}

/* ------------------------------------------------------------------ GitHub */

const github: ProviderAdapter = {
  authorizeUrl(redirectUri, state) {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_INTEGRATION_CLIENT_ID ?? "",
      redirect_uri: redirectUri,
      scope: "repo",
      state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  },

  async exchangeCode(code, redirectUri) {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_INTEGRATION_CLIENT_ID,
          client_secret: process.env.GITHUB_INTEGRATION_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    await expectOk(response, "GitHub token");
    const data = await response.json();

    if (data.error) throw new Error(`GitHub token: ${data.error_description}`);

    return {
      accessToken: data.access_token,
      scope: data.scope ?? null,
    };
  },

  async listBoards(integration) {
    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${token(integration)}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      }
    );

    await expectOk(response, "GitHub repos");
    const repos = (await response.json()) as { id: number; full_name: string }[];

    return repos.map((repo) => ({ id: repo.full_name, name: repo.full_name }));
  },

  async listIssues(integration) {
    if (!integration.boardId) return [];

    const response = await fetch(
      `https://api.github.com/repos/${integration.boardId}/issues?state=open&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token(integration)}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      }
    );

    await expectOk(response, "GitHub issues");
    const issues = (await response.json()) as {
      number: number;
      title: string;
      html_url: string;
      pull_request?: unknown;
      labels: { name: string }[];
    }[];

    return issues
      // A API de issues do GitHub também devolve pull requests.
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        externalId: String(issue.number),
        key: `#${issue.number}`,
        title: issue.title,
        type: issue.labels[0]?.name ?? null,
        url: issue.html_url,
      }));
  },

  async pushPoints(integration, externalId, points) {
    // O GitHub não tem campo de estimativa nativo, então a estimativa vai como
    // comentário — que é o que o handoff descreve para este provedor.
    const response = await fetch(
      `https://api.github.com/repos/${integration.boardId}/issues/${externalId}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token(integration)}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: `Planning poker: **${points}** pontos.`,
        }),
      }
    );

    await expectOk(response, "GitHub comment");
  },
};

/* -------------------------------------------------------------------- Jira */

const JIRA_SCOPES = "read:jira-work write:jira-work offline_access";

const jira: ProviderAdapter = {
  authorizeUrl(redirectUri, state) {
    const params = new URLSearchParams({
      audience: "api.atlassian.com",
      client_id: process.env.JIRA_CLIENT_ID ?? "",
      scope: JIRA_SCOPES,
      redirect_uri: redirectUri,
      state,
      response_type: "code",
      prompt: "consent",
    });
    return `https://auth.atlassian.com/authorize?${params}`;
  },

  async exchangeCode(code, redirectUri) {
    const response = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.JIRA_CLIENT_ID,
        client_secret: process.env.JIRA_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    await expectOk(response, "Jira token");
    const data = await response.json();

    // O token do Jira não vale por si: é preciso descobrir o cloudId do site.
    const resources = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
        cache: "no-store",
      }
    );

    await expectOk(resources, "Jira resources");
    const sites = (await resources.json()) as { id: string; name: string }[];

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
      scope: data.scope ?? null,
      workspace: sites[0]?.name ?? null,
      workspaceId: sites[0]?.id ?? null,
    };
  },

  async listBoards(integration) {
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${integration.workspaceId}/rest/api/3/project/search?maxResults=100`,
      {
        headers: {
          Authorization: `Bearer ${token(integration)}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    await expectOk(response, "Jira projects");
    const data = (await response.json()) as {
      values: { key: string; name: string }[];
    };

    return data.values.map((project) => ({
      id: project.key,
      name: `${project.key} · ${project.name}`,
    }));
  },

  async listIssues(integration) {
    if (!integration.boardId) return [];

    const jql = `project = "${integration.boardId}" AND statusCategory != Done ORDER BY created DESC`;
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${integration.workspaceId}/rest/api/3/search/jql?` +
        new URLSearchParams({
          jql,
          maxResults: "50",
          fields: "summary,issuetype",
        }),
      {
        headers: {
          Authorization: `Bearer ${token(integration)}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    await expectOk(response, "Jira issues");
    const data = (await response.json()) as {
      issues: {
        id: string;
        key: string;
        fields: { summary: string; issuetype?: { name: string } };
      }[];
    };

    return (data.issues ?? []).map((issue) => ({
      externalId: issue.key,
      key: issue.key,
      title: issue.fields.summary,
      type: issue.fields.issuetype?.name ?? null,
      url: null,
    }));
  },

  async pushPoints(integration, externalId, points) {
    const base = `https://api.atlassian.com/ex/jira/${integration.workspaceId}/rest/api/3/issue/${externalId}`;
    const headers = {
      Authorization: `Bearer ${token(integration)}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // O campo de story points é um customfield cujo id varia por instalação.
    // Quando ele estiver configurado, escrevemos nele; caso contrário a
    // estimativa vai como comentário, para nunca perder o registro.
    const fieldId = process.env.JIRA_STORY_POINTS_FIELD;
    const numeric = Number(points.replace(",", "."));

    if (fieldId && Number.isFinite(numeric)) {
      const response = await fetch(base, {
        method: "PUT",
        headers,
        body: JSON.stringify({ fields: { [fieldId]: numeric } }),
      });

      if (response.ok) return;
    }

    const comment = await fetch(`${base}/comment`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: `Planning poker: ${points} pontos.` },
              ],
            },
          ],
        },
      }),
    });

    await expectOk(comment, "Jira comment");
  },
};

/* ------------------------------------------------------------------ Trello */

const trello: ProviderAdapter = {
  authorizeUrl(redirectUri, state) {
    // O Trello usa um fluxo de token de fragmento, não OAuth 2 padrão: ele
    // devolve o token no hash da URL, que a página de callback captura.
    const params = new URLSearchParams({
      expiration: "never",
      scope: "read,write",
      response_type: "token",
      name: "PokerArchitect",
      key: process.env.TRELLO_API_KEY ?? "",
      return_url: `${redirectUri}?state=${encodeURIComponent(state)}`,
    });
    return `https://trello.com/1/authorize?${params}`;
  },

  async exchangeCode(code) {
    // No Trello o "code" já é o próprio token, capturado do fragmento.
    const response = await fetch(
      `https://api.trello.com/1/members/me?key=${process.env.TRELLO_API_KEY}&token=${code}`,
      { cache: "no-store" }
    );

    await expectOk(response, "Trello member");
    const member = (await response.json()) as { username: string };

    return { accessToken: code, workspace: member.username };
  },

  async listBoards(integration) {
    const response = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${process.env.TRELLO_API_KEY}&token=${token(integration)}&filter=open&fields=name`,
      { cache: "no-store" }
    );

    await expectOk(response, "Trello boards");
    const boards = (await response.json()) as { id: string; name: string }[];

    return boards.map((board) => ({ id: board.id, name: board.name }));
  },

  async listIssues(integration) {
    if (!integration.boardId) return [];

    const response = await fetch(
      `https://api.trello.com/1/boards/${integration.boardId}/cards?key=${process.env.TRELLO_API_KEY}&token=${token(integration)}&fields=name,shortLink,url,idShort`,
      { cache: "no-store" }
    );

    await expectOk(response, "Trello cards");
    const cards = (await response.json()) as {
      id: string;
      idShort: number;
      name: string;
      url: string;
    }[];

    return cards.map((card) => ({
      externalId: card.id,
      key: `#${card.idShort}`,
      title: card.name,
      type: null,
      url: card.url,
    }));
  },

  async pushPoints(integration, externalId, points) {
    const response = await fetch(
      `https://api.trello.com/1/cards/${externalId}/actions/comments?key=${process.env.TRELLO_API_KEY}&token=${token(integration)}&text=${encodeURIComponent(`Planning poker: ${points} pontos.`)}`,
      { method: "POST" }
    );

    await expectOk(response, "Trello comment");
  },
};

/* ---------------------------------------------------------------- IzzyPlan */

const IZZY_BASE = "https://izzyplan.com/api/v1";

function izzyHeaders(token: string) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "api-token": token,
  };
}

interface IzzyPage<T> {
  data?: T[];
}

/**
 * IzzyPlan.
 *
 * Não usa OAuth: a autorização é um header `api-token` com uma credencial que a
 * pessoa gera no próprio IzzyPlan. E a API pública é **somente leitura** — não
 * há endpoint de escrita documentado, então `pushPoints` não existe aqui e a
 * interface não oferece "Enviar para IzzyPlan".
 */
const izzyplan: ProviderAdapter = {
  async connectWithToken(token) {
    // Valida a credencial antes de guardá-la, para o erro aparecer no momento
    // de conectar e não semanas depois, na hora de importar uma tarefa.
    const response = await fetch(`${IZZY_BASE}/projects`, {
      headers: izzyHeaders(token),
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("Token recusado pelo IzzyPlan");
    }

    await expectOk(response, "IzzyPlan projects");

    return { accessToken: token, workspace: "IzzyPlan" };
  },

  async listBoards(integration) {
    const response = await fetch(`${IZZY_BASE}/projects?per_page=100`, {
      headers: izzyHeaders(token(integration)),
      cache: "no-store",
    });

    await expectOk(response, "IzzyPlan projects");
    const payload = (await response.json()) as IzzyPage<{
      id: number;
      name: string;
    }>;

    return (payload.data ?? []).map((project) => ({
      id: String(project.id),
      name: project.name,
    }));
  },

  async listIssues(integration) {
    if (!integration.boardId) return [];

    // A coleção documenta `work_id` no *corpo* de um GET, o que `fetch` não
    // permite enviar; mandamos como query string, que é a leitura padrão. O
    // valor é o id do projeto escolhido.
    const response = await fetch(
      `${IZZY_BASE}/tasks?` +
        new URLSearchParams({ work_id: integration.boardId, per_page: "100" }),
      { headers: izzyHeaders(token(integration)), cache: "no-store" }
    );

    await expectOk(response, "IzzyPlan tasks");
    const payload = (await response.json()) as IzzyPage<{
      id: number;
      organization_task_id?: number;
      name: string;
      task_state?: { name?: string };
    }>;

    return (payload.data ?? []).map((task) => ({
      externalId: String(task.id),
      key: task.organization_task_id ? `#${task.organization_task_id}` : `#${task.id}`,
      title: task.name,
      type: task.task_state?.name ?? null,
      url: null,
    }));
  },

  // Sem pushPoints: a API documentada não expõe escrita.
};

const ADAPTERS: Partial<Record<ProviderId, ProviderAdapter>> = {
  github,
  jira,
  trello,
  izzyplan,
};

export function getAdapter(provider: string): ProviderAdapter | null {
  return ADAPTERS[provider as ProviderId] ?? null;
}
