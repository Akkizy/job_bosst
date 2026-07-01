# Vagas Diárias — SaaS de busca diária de vagas (qualquer área)

Site onde cada pessoa cria conta, define o cargo que quiser (qualquer
área — design, tech, financeiro, marketing, etc.) + modelo de trabalho
desejado, e recebe automaticamente todo dia as vagas que combinam com
o perfil dela.

Stack: **Next.js** (site + servidor) + **Supabase** (login + banco de
dados) + **Vercel** (hospedagem gratuita, com agendamento diário).

Custo: **R$0** nos planos gratuitos, suficiente para uso entre você e
seus amigos.

---

## Passo 1 — Criar o projeto no Supabase

1. Acesse https://supabase.com e crie uma conta gratuita.
2. Clique em **"New project"**, dê um nome (ex: `vagas-design`) e uma senha
   de banco de dados (guarde essa senha em local seguro).
3. Aguarde 1-2 minutos enquanto o projeto é criado.
4. Vá em **SQL Editor** (menu lateral) → **New query**.
5. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o
   conteúdo, cole no editor e clique em **"Run"**. Isso cria as tabelas
   necessárias (preferências, vagas, e o que cada usuário já viu).
6. Vá em **Project Settings** (ícone de engrenagem) → **API**. Você vai
   precisar de 3 valores nessa tela:
   - **Project URL**
   - **anon public key**
   - **service_role key** (clique em "Reveal" para ver)

Guarde esses 3 valores — vamos usar no Passo 3.

## Passo 2 — Subir o código para o GitHub

1. Crie um repositório novo no GitHub (pode ser privado), ex: `vagas-design`.
2. Suba todos os arquivos desta pasta, mantendo a estrutura de pastas
   (`app/`, `lib/`, `supabase/`, etc.) — use o GitHub Desktop ou a opção
   de upload pela própria interface do GitHub.

## Passo 3 — Publicar no Vercel

1. Acesse https://vercel.com e crie conta (pode entrar direto com GitHub).
2. Clique em **"Add New"** → **"Project"**.
3. Selecione o repositório `vagas-design` que você acabou de subir.
4. Antes de clicar em "Deploy", abra a seção **"Environment Variables"**
   e adicione:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | a Project URL do Passo 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a anon public key do Passo 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | a service_role key do Passo 1 |
   | `CRON_SECRET` | qualquer senha aleatória que você escolher, ex: `f93kd82maldj` |

5. Clique em **"Deploy"**. Em 1-2 minutos seu site estará no ar, com uma
   URL tipo `vagas-design.vercel.app`.

## Passo 4 — Confirmar o agendamento diário

O arquivo `vercel.json` já está configurado para rodar a busca de vagas
todo dia às 9h (horário de Brasília), automaticamente. Você pode confirmar
isso em: **Project → Settings → Cron Jobs** no painel da Vercel.

Para testar manualmente sem esperar o horário, acesse no navegador:
```
https://SEU-SITE.vercel.app/api/cron-fetch-jobs
```
Isso vai pedir autenticação — para testar, use uma ferramenta como
[Postman](https://www.postman.com/) ou o terminal:
```
curl -H "Authorization: Bearer SEU_CRON_SECRET" https://SEU-SITE.vercel.app/api/cron-fetch-jobs
```
(troque `SEU_CRON_SECRET` pelo valor que você definiu no Passo 3)

## Passo 5 — Convidar seus amigos

Basta compartilhar a URL do site (`vagas-design.vercel.app`). Cada pessoa
cria a própria conta e define as próprias preferências — os dados são
isolados por usuário (ninguém vê a preferência de outra pessoa).

---

## Estrutura do projeto

```
app/
  login/         → página de login
  signup/        → página de cadastro
  dashboard/     → painel com preferências + lista de vagas
  api/cron-fetch-jobs/  → rota chamada automaticamente todo dia
lib/
  supabase-browser.js   → cliente Supabase (navegador)
  supabase-server.js    → cliente Supabase (servidor)
  job-sources.js         → lógica de busca e filtro de vagas
supabase/
  schema.sql      → script de criação das tabelas
vercel.json       → configuração do agendamento diário
```

## Limitações importantes (leia antes de divulgar pra galera)

- As fontes de vagas usadas (RemoteOK, Arbeitnow) são gratuitas e sem
  necessidade de chave de API, mas cobrem majoritariamente vagas
  remotas/internacionais. Vagas de LinkedIn, Gupy e Catho não têm API
  pública gratuita — adicionar essas fontes exigiria parcerias ou scraping,
  que tem riscos legais e técnicos maiores.
- O filtro de "híbrido" hoje funciona como "qualquer um", porque as fontes
  atuais não diferenciam híbrido de presencial com precisão.
- Os e-mails de confirmação de cadastro usam o serviço padrão do Supabase,
  que tem limite de envios no plano gratuito (suficiente para um grupo
  pequeno de amigos, mas não para uso em massa).
- O plano gratuito da Vercel e do Supabase têm limites de uso (geralmente
  bem acima do necessário pra uso pessoal/pequenos grupos, mas vale saber
  que existem caso o projeto cresça).

## Próximos passos possíveis (se quiser evoluir depois)
- Notificação por e-mail ou WhatsApp quando aparecer vaga nova (hoje a
  pessoa precisa abrir o site para ver)
- Permitir mais de uma preferência por usuário
- Adicionar fontes de vagas brasileiras via parcerias/APIs pagas
