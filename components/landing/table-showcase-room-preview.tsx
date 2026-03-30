"use client";

import { useEffect, useMemo, useState } from "react";
import { PokerTable } from "@/components/room/poker-table";
import { VotingCard } from "@/components/room/voting-card";
import { VotingStats } from "@/components/room/voting-stats";
import { ParticipantsList } from "@/components/room/participants-list";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, RotateCcw, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ListParticipant, Vote } from "@/types/entities";
import type { Participant } from "@/types/participant";

type Phase = "waiting" | "allVoted" | "revealing" | "revealed";

const PHASE_ORDER: Phase[] = ["waiting", "allVoted", "revealing", "revealed"];
const PHASE_MS: Record<Phase, number> = {
  waiting: 2400,
  allVoted: 1800,
  revealing: 2200,
  revealed: 4500,
};

const DEMO_IDS = { p1: "demo-p1", p2: "demo-p2" };
const DEMO_STORY_ID = "showcase-story";
const DECK = ["1", "2", "3", "5", "8"] as const;
const V1 = 5;
const V2 = 3;
const LOCAL_PICK = 3;

function makeVote(userId: string, value: number): Vote {
  return {
    id: `vote-${userId}`,
    userId,
    storyId: DEMO_STORY_ID,
    value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function TableShowcaseRoomPreview() {
  const t = useTranslations("home.showcase");
  const tGame = useTranslations("room.game");
  const tInvite = useTranslations("room.invite");

  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = PHASE_ORDER[i % PHASE_ORDER.length];
      setPhase(current);
      const ms = PHASE_MS[current];
      i += 1;
      timeout = setTimeout(tick, ms);
    };

    tick();
    return () => clearTimeout(timeout);
  }, [mounted]);

  useEffect(() => {
    if (phase !== "revealing") {
      setRevealCountdown(null);
      return;
    }
    setRevealCountdown(3);
    const a = setTimeout(() => setRevealCountdown(2), 500);
    const b = setTimeout(() => setRevealCountdown(1), 1000);
    const c = setTimeout(() => setRevealCountdown(null), 1500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [phase]);

  const effectivePhase: Phase = !mounted ? "waiting" : phase;

  const hasVotes =
    effectivePhase === "allVoted" ||
    effectivePhase === "revealing" ||
    effectivePhase === "revealed";

  const revealed = effectivePhase === "revealed";
  const isRevealing = effectivePhase === "revealing";

  const demoVotes: Vote[] = useMemo(() => {
    if (!hasVotes) return [];
    return [makeVote(DEMO_IDS.p1, V1), makeVote(DEMO_IDS.p2, V2)];
  }, [hasVotes]);

  const participants: Participant[] = useMemo(
    () => [
      {
        id: DEMO_IDS.p1,
        userId: DEMO_IDS.p1,
        name: t("player1"),
        hasVoted: hasVotes,
        vote: revealed ? V1 : "?",
        image: "",
        isAnonymous: true,
      },
      {
        id: DEMO_IDS.p2,
        userId: DEMO_IDS.p2,
        name: t("player2"),
        hasVoted: hasVotes,
        vote: revealed ? V2 : "?",
        image: "",
        isAnonymous: true,
      },
    ],
    [t, hasVotes, revealed]
  );

  const listParticipants: ListParticipant[] = useMemo(
    () =>
      participants.map((p) => ({
        ...p,
        hasVoted: hasVotes,
        vote: revealed && typeof p.vote === "number" ? p.vote : "?",
      })),
    [participants, hasVotes, revealed]
  );

  const tableVotes: Vote[] = demoVotes;

  const participantsWithVotes = participants.map((participant) => {
    const vote = demoVotes.find(
      (v) => v.userId === participant.id || v.userId === participant.userId
    );
    const finalValue = revealed && vote ? vote.value : "?";
    return { ...participant, vote: finalValue };
  });

  return (
    <div
      className="pointer-events-none select-none bg-background"
      aria-label={t("previewAria")}
    >
      <div className="grid h-full min-h-[420px] grid-cols-1 gap-4 p-4 md:min-h-[480px] md:grid-cols-[220px_1fr] md:gap-6 md:p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">{tGame("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("demoStoryTitle")}</p>
          </div>
          <ParticipantsList participants={listParticipants} />
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="gap-2"
            >
              {isRevealing ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  {revealCountdown !== null
                    ? tGame("revealingIn", { countdown: revealCountdown })
                    : tGame("revealing")}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 shrink-0" />
                  {tGame("reveal")}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled className="gap-2">
              <RotateCcw className="h-4 w-4 shrink-0" />
              {tGame("reset")}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled className="gap-2">
              <UserPlus className="h-4 w-4 shrink-0" />
              {tInvite("button")}
            </Button>
          </div>

          <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-visible pb-10 md:min-h-[280px]">
            <PokerTable
              participants={participantsWithVotes}
              revealed={revealed}
              votes={tableVotes}
              className="!mt-0 !max-h-[min(52vh,440px)] w-full max-w-[720px] origin-center scale-[0.68] md:scale-[0.78]"
            />
            <VotingStats
              votes={demoVotes.map((v) => v.value)}
              revealed={revealed}
            />
          </div>

          <div className="rounded-lg border border-border p-3 md:p-4">
            <div className="flex flex-wrap justify-center gap-2">
              {DECK.map((value) => {
                const n = Number(value);
                const selected = hasVotes && !revealed && LOCAL_PICK === n;
                return (
                  <VotingCard
                    key={value}
                    value={value}
                    selected={selected}
                    revealed={revealed}
                    disabled
                    hideValue={false}
                    size="sm"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
