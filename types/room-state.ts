/**
 * Formato do snapshot de sala trocado entre servidor e clientes.
 *
 * O tempo real deste app é baseado em *snapshot versionado*, não em deltas: o
 * servidor é dono do estado, e toda mutação publica o estado inteiro com um
 * `version` maior. O cliente aplica um snapshot apenas se `version` for maior
 * que o último aplicado, e pode sempre buscar o estado atual via GET. Assim um
 * evento perdido (reconexão, aba em background, entrega fora de ordem) se
 * conserta sozinho na próxima entrega ou reconciliação — não existe estado
 * derivado que fique permanentemente errado.
 */

export type ChipKind = "agree" | "explain" | "risk" | "call";
export type ChipMode = "land" | "call";
export type TaskSource = "manual" | "jira" | "trello" | "github" | "izzyplan";
export type TaskStatus = "queued" | "active" | "estimated";

export interface SnapshotParticipant {
  id: string;
  name: string;
  image: string | null;
  role: string;
  isAnonymous: boolean;
  isOnline: boolean;
  /** Visível sempre — é o que acende o ponto de status na cadeira. */
  hasVoted: boolean;
  /** Preenchido somente depois da revelação. */
  vote: string | null;
  /** Quantas fichas de "pagar pra ver" esta pessoa recebeu na rodada. */
  callsReceived: number;
}

export interface SnapshotChip {
  id: string;
  authorId: string;
  targetId: string | null;
  kind: ChipKind;
  mode: ChipMode;
  /** Deslocamento sorteado do pouso, em pontos percentuais da mesa. */
  jitterX: number;
  jitterY: number;
  /** Rotação final, em graus. */
  rot: number;
  createdAt: string;
}

export interface SnapshotStory {
  id: string;
  title: string;
  taskId: string | null;
  revealed: boolean;
  /**
   * Instante absoluto (ISO) em que as cartas viram. Os clientes agendam a
   * virada contra este valor corrigido pelo offset de relógio, então todo mundo
   * revela no mesmo momento independente de quando recebeu o evento.
   */
  revealAt: string | null;
  startedAt: string;
}

export interface SnapshotTask {
  id: string;
  key: string;
  title: string;
  source: TaskSource;
  type: string | null;
  externalUrl: string | null;
  order: number;
  status: TaskStatus;
}

export interface SnapshotEstimate {
  id: string;
  key: string;
  title: string;
  source: TaskSource;
  points: string;
  consensus: number;
  durationSeconds: number | null;
  createdAt: string;
}

export interface RoomSnapshot {
  version: number;
  /** Relógio do servidor, usado pelos clientes para corrigir skew local. */
  serverNow: string;
  room: {
    id: string;
    name: string;
    deckValues: string[];
    expiresAt: string;
    /** Nulo em salas criadas sem login. */
    ownerId: string | null;
  };
  story: SnapshotStory | null;
  participants: SnapshotParticipant[];
  chips: SnapshotChip[];
  queue: SnapshotTask[];
  estimates: SnapshotEstimate[];
}

/** Nome do único evento Pusher que o app publica hoje. */
export const ROOM_STATE_EVENT = "room:state";

/** Header que carrega o id estável do browser nas requisições de mutação. */
export const CLIENT_ID_HEADER = "x-poker-client-id";

/** Contagem regressiva da revelação: 3 passos de 800ms, como no handoff. */
export const REVEAL_COUNTDOWN_STEPS = 3;
export const REVEAL_STEP_MS = 800;
export const REVEAL_COUNTDOWN_MS = REVEAL_COUNTDOWN_STEPS * REVEAL_STEP_MS;
