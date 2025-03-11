import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="p-8">
      <main className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-8">
          Organize suas sessões de Planning Poker
        </h2>

        <div className="space-y-4">
          <Button size="lg" variant="default" asChild>
            {/* <a href="/room/create">Criar Nova Sala</a> */}
          </Button>

          <p className="text-muted-foreground">
            ou entre em uma sala existente usando o código
          </p>
        </div>
      </main>
    </div>
  );
}
