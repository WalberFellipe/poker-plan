/**
 * O layout raiz já fornece o `<main>`; aqui só centralizamos o cartão.
 * A versão anterior aninhava um segundo `<main>` dentro do primeiro.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-5 py-12">
      {children}
    </div>
  );
}
