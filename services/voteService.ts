export const voteService = {
  async loadVotes(storyId: string) {
    const response = await fetch(`/api/stories/${storyId}/votes`);
    if (!response.ok) throw new Error('Erro ao carregar votos');
    return response.json();
  },

  async sendVote(storyId: string, value: number, participantId?: string) {
    const response = await fetch(`/api/stories/${storyId}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, participantId })
    });
    if (!response.ok) throw new Error('Erro ao enviar voto');
    return response.json();
  },

  async revealVotes(storyId: string, participantId?: string) {
    const response = await fetch(`/api/stories/${storyId}/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId })
    });
    if (!response.ok) throw new Error('Erro ao revelar votos');
    return response.json();
  },

  async resetVotes(storyId: string, participantId?: string) {
    const response = await fetch(`/api/stories/${storyId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId })
    });
    if (!response.ok) throw new Error('Erro ao resetar história');
    return response.json();
  }
}; 