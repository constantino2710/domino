# Dominó Multiplayer

Jogo de **dominó multiplayer em tempo real** rodando no navegador. Backend em Node.js com WebSocket, frontend em React + Vite, e persistência opcional de usuários e histórico de partidas via Supabase (Postgres + Auth).

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Como rodar](#como-rodar)
- [Banco de dados (Supabase)](#banco-de-dados-supabase)
- [Scripts disponíveis](#scripts-disponíveis)
- [Arquitetura](#arquitetura)
- [Protocolo WebSocket](#protocolo-websocket)
- [Regras do jogo](#regras-do-jogo)
- [Deploy](#deploy)
- [Solução de problemas](#solução-de-problemas)

---

## Visão geral

- Salas de jogo com 2 a 4 jogadores, criadas e descobertas via lobby em tempo real.
- Comunicação cliente-servidor 100% por **WebSocket** — o servidor é a fonte da verdade do estado da partida.
- Login opcional via **Supabase Auth** (email/senha). Sem login, é possível jogar como convidado usando apenas um nome.
- Estatísticas (vitórias, derrotas, partidas jogadas) e histórico de rodadas persistidos no Postgres do Supabase quando o usuário está autenticado.
- Detecção automática de tipo de vitória: **simples**, **carroça**, **lá-e-lô** e **carroça + lá-e-lô**.

---

## Stack

| Camada       | Tecnologia                                              |
|--------------|---------------------------------------------------------|
| Backend      | Node.js, [`ws`](https://github.com/websockets/ws), `http` nativo |
| Frontend     | React 18, Vite 5                                        |
| Auth / DB    | Supabase (Postgres + Auth + RLS)                        |
| Migrations   | Supabase CLI (rodada via Docker)                        |
| Dev tooling  | `concurrently`, `dotenv`                                |

---

## Estrutura do projeto

```
domino/
├── server.js                      # Backend — HTTP + WebSocket + lógica do jogo
├── package.json                   # Deps e scripts do backend
│
├── client/                        # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx                # Roteamento de telas (Auth / Lobby / Game)
│   │   ├── main.jsx               # Entry point do React
│   │   ├── supabase.js            # Cliente Supabase (anon key)
│   │   ├── components/
│   │   │   ├── Auth.jsx           # Tela de login/cadastro
│   │   │   ├── Lobby.jsx          # Lista e criação de salas
│   │   │   ├── Game.jsx           # Mesa de jogo
│   │   │   ├── Board.jsx          # Tabuleiro (peças encadeadas)
│   │   │   ├── Hand.jsx           # Mão do jogador local
│   │   │   ├── OpponentsArea.jsx  # Mãos dos adversários (versos)
│   │   │   ├── Tile.jsx           # Peça de dominó
│   │   │   ├── FlyingTile.jsx     # Animação de jogada
│   │   │   ├── SideSelector.jsx   # Escolher lado (esquerda/direita)
│   │   │   ├── RoundEndOverlay.jsx# Resumo de fim de rodada
│   │   │   ├── Notification.jsx   # Toasts
│   │   │   └── TopBar.jsx         # Header (usuário, sair, etc.)
│   │   └── hooks/
│   │       ├── useAuth.js         # Sessão Supabase
│   │       └── useGame.js         # Conexão WebSocket + estado da partida
│   ├── package.json
│   └── vite.config.js
│
├── supabase/                      # Schema e migrations
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260424000000_init.sql
│   │   └── 20260428000000_ensure_profile_trigger_and_backfill.sql
│   └── templates/
│       └── confirmation.html      # E-mail de confirmação customizado
│
├── scripts/                       # Wrappers para a Supabase CLI
│   ├── supa.js                    # Roda a CLI via Docker
│   └── supa-native.js             # Roda a CLI instalada localmente
│
├── docker-compose.yml             # Serviço supabase-cli
├── Dockerfile.supabase            # Imagem da Supabase CLI
├── .env.example                   # Template de variáveis do backend
└── client/.env.example            # Template de variáveis do frontend
```

---

## Pré-requisitos

- **Node.js 20+** e **npm**
- **Conta Supabase** (free tier serve) — opcional, mas necessário para login e ranking
- **Docker** — opcional, usado apenas para rodar a Supabase CLI sem instalá-la localmente

---

## Configuração

### 1. Clonar e instalar dependências

```bash
git clone <repo-url>
cd domino
npm install
npm install --prefix client
```

### 2. Variáveis de ambiente

**Backend** — copie `.env.example` para `.env` na raiz e preencha:

```env
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8080

# Apenas se for usar a CLI de migrations
SUPABASE_ACCESS_TOKEN=
SUPABASE_DB_PASSWORD=
SUPABASE_PROJECT_REF=
```

**Frontend** — copie `client/.env.example` para `client/.env`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

> Sem as variáveis do Supabase, o servidor inicia normalmente mas roda **sem persistência** (modo convidado apenas). Você verá um aviso no console.

---

## Como rodar

### Desenvolvimento

```bash
npm run dev
```

Sobe em paralelo:
- **Backend** em `http://localhost:8080` (HTTP + WebSocket em `/ws`)
- **Frontend Vite** em `http://localhost:5173` (com HMR)

### Produção (build + serve)

```bash
npm run build      # build do client em client/dist
npm start          # backend serve os estáticos + WebSocket na mesma porta
```

Acesse `http://localhost:8080`.

---

## Banco de dados (Supabase)

### Schema

Duas tabelas principais, definidas em [`supabase/migrations/`](supabase/migrations/):

- **`profiles`** — um por usuário autenticado (criado automaticamente via trigger ao registrar). Guarda `username`, `wins`, `losses`, `games_played`.
- **`matches`** — histórico de rodadas concluídas. Guarda vencedor, tipo de vitória, pontuação e snapshot dos jogadores em JSON.

Inclui:
- Trigger `on_auth_user_created` que cria o profile automaticamente.
- RPC `increment_stats(profile_id, won)` chamada pelo backend após cada rodada.
- **Row Level Security** ativado: leitura pública (para ranking), escrita só via `service_role`.

### Aplicar migrations

Os scripts de DB usam a Supabase CLI. Você pode rodá-la **nativamente** (se instalada) ou **via Docker** (sem instalação local).

**Via Docker** (recomendado — basta `docker compose` instalado):

```bash
# Vincular ao projeto remoto (uma vez)
node scripts/supa.js link

# Aplicar migrations
node scripts/supa.js db push
```

**Via CLI nativa** (precisa `npm install -g supabase`):

```bash
npm run db:link
npm run db:push
```

### Outros comandos úteis

```bash
npm run db:status   # listar migrations aplicadas
npm run db:new      # criar nova migration
npm run db:diff     # diff entre schema local e remoto
npm run db:pull     # puxar schema do remoto
```

---

## Scripts disponíveis

Definidos em [`package.json`](package.json):

| Script              | O que faz                                                    |
|---------------------|--------------------------------------------------------------|
| `npm start`         | Inicia o backend em produção (`node server.js`)              |
| `npm run dev`       | Backend + frontend Vite em paralelo                          |
| `npm run build`     | Build do frontend (`client/dist/`)                           |
| `npm run db:link`   | Vincula o projeto local ao Supabase remoto                   |
| `npm run db:push`   | Aplica migrations pendentes no Supabase                      |
| `npm run db:new`    | Cria uma nova migration vazia                                |
| `npm run db:status` | Lista migrations e seu status                                |
| `npm run db:diff`   | Diff entre schema local e remoto                             |
| `npm run db:pull`   | Sincroniza migrations a partir do remoto                     |

---

## Arquitetura

```
┌──────────────────┐         WebSocket /ws        ┌──────────────────────┐
│  Browser (React) │ ◄──────────────────────────► │  Node.js (server.js) │
│                  │                              │                      │
│  - Lobby         │                              │  - Salas em memória  │
│  - Game UI       │                              │  - Lógica do dominó  │
│  - Auth (anon)   │                              │  - Validação jogadas │
└────────┬─────────┘                              └──────────┬───────────┘
         │                                                   │
         │ HTTPS (anon key)                                  │ service_role
         ▼                                                   ▼
       ┌─────────────────────────────────────────────────────────┐
       │                    Supabase                             │
       │  Auth (email/password)  •  Postgres  •  RLS  •  RPCs    │
       └─────────────────────────────────────────────────────────┘
```

### Pontos-chave

- **Estado autoritativo no servidor.** O cliente nunca decide se uma jogada é válida — ele envia a intenção e o servidor responde com o novo estado completo.
- **Salas em memória.** Cada partida vive em `rooms[roomId]` no processo do `server.js`. Salas vazias são deletadas após **60 s** de TTL para sobreviver a reloads do browser.
- **Endpoint de diagnóstico:** `GET /api/rooms` retorna PID, uptime e snapshot das salas.
- **Frontend autentica direto no Supabase** com a anon key. O backend usa a `service_role` para gravar estatísticas após rodadas.
- **SPA fallback:** o `server.js` serve `index.html` para qualquer rota sem extensão, e 404 para arquivos estáticos faltantes (evita servir HTML onde o browser espera JS/CSS).

---

## Protocolo WebSocket

Conexão em `ws://host:porta/ws`. Mensagens são JSON com um campo `type`.

### Cliente → Servidor

| `type`           | Payload                              | Descrição                       |
|------------------|--------------------------------------|---------------------------------|
| `subscribeRooms` | —                                    | Receber updates da lista        |
| `createRoom`     | `{ name, roomId }`                   | Criar sala e entrar             |
| `joinRoom`       | `{ name, roomId }`                   | Entrar em sala existente        |
| `start`          | —                                    | Iniciar partida (host)          |
| `play`           | `{ piece: [a,b], side: 'L'\|'R' }` | Jogar peça                      |
| `pass`           | —                                    | Passar a vez (sem peça válida)  |

### Servidor → Cliente

| `type`        | Descrição                                                |
|---------------|----------------------------------------------------------|
| `roomList`    | Lista de salas (broadcast a subscribers do lobby)        |
| `joined`      | Confirmação de entrada na sala                           |
| `started`     | Partida iniciada                                         |
| `state`       | Snapshot completo (board, mãos, turno, pontuação)        |
| `roundEnd`    | Fim de rodada (vencedor, tipo de vitória, pontos)        |
| `error`       | Mensagem de erro (ex.: "Peça não encaixa nesse lado")    |

---

## Regras do jogo

- **Baralho:** 28 peças (0-0 a 6-6), embaralhadas.
- **Mão inicial:** 7 peças por jogador (2 a 4 jogadores).
- **Quem começa:** quem tiver a maior carroça em mão (6-6, depois 5-5, …).
- **Jogadas:** encaixar uma das pontas da peça em um dos lados abertos do tabuleiro.
- **Passar:** só permitido quando não há jogada possível (servidor valida).
- **Fim de rodada:**
  - **Empty / batida** — um jogador zera a mão.
  - **Blocked / fechado** — todos passam consecutivamente.
- **Tipos de vitória:**
  - `simple` — batida normal.
  - `carroca` — última peça jogada é uma carroça.
  - `laeelou` — batida encaixando em ambas as pontas (peça com os dois valores das extremidades).
  - `carroca_laeelou` — combinação dos dois.

---

## Deploy

O servidor serve frontend e backend na mesma porta, então qualquer host Node funciona (Render, Railway, Fly.io, VPS, etc.).

Checklist mínimo:

1. `npm install && npm run build` na release.
2. Variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `PORT` no ambiente.
3. Variáveis `VITE_*` precisam estar presentes **no momento do build** (Vite as injeta no bundle).
4. `npm start` como comando de start.

> WebSocket: garanta que o proxy/load-balancer encaminhe upgrades em `/ws`.

---

## Solução de problemas

**`⚠ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados`**
O servidor sobe sem persistência. Crie o `.env` da raiz se você quer auth/estatísticas.

**Frontend mostra "Failed to fetch" ao logar**
Faltam as variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` em `client/.env`. Reinicie o `npm run dev` após criar.

**Sala "fantasma" no lobby**
Salas vazias têm TTL de 60 s. Se quiser limpar imediatamente, reinicie o servidor.

**`docker compose run` falha com permissão**
No Linux/macOS, garanta que seu usuário está no grupo `docker` ou use `sudo`. No Windows, abra o Docker Desktop antes.

**Migrations não aplicam**
Confira `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN` (gerado em https://supabase.com/dashboard/account/tokens) e `SUPABASE_DB_PASSWORD` no `.env`.
