/**
 * As rotas de sala são as únicas que continuam sendo renderizadas sob demanda
 * — o `roomId` é desconhecido no build. Numa função serverless fria isso pode
 * levar um segundo ou dois, e sem esta tela a navegação parecia travada.
 */
export default function RoomLoading() {
  return (
    <div className="mx-auto flex max-w-[1560px] animate-pulse flex-col gap-9 px-5 pb-16 pt-6 md:px-10">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-28 rounded-sm bg-pa-text/[.07]" />
        <div className="h-7 w-72 max-w-full rounded-sm bg-pa-text/[.07]" />
      </div>
      <div className="h-[420px] rounded-[290px/230px] border border-cy/12 bg-pa-text/[.03] md:h-[520px]" />
      <div className="flex gap-2.5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-[88px] w-[62px] rounded-lg bg-pa-text/[.05]"
          />
        ))}
      </div>
    </div>
  );
}
