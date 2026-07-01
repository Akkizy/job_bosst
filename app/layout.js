import './globals.css'

export const metadata = {
  title: 'Busca de Vagas — atualização diária automática',
  description: 'Encontre vagas todos os dias, filtradas pelas suas preferências',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
