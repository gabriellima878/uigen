# CLAUDE.md

Este arquivo fornece orientacao ao Claude Code (claude.ai/code) ao trabalhar com o codigo deste repositorio.

## O Que E Isto

UIGen e um gerador de componentes React com IA e preview ao vivo. Os usuarios descrevem componentes em uma interface de chat, o Claude os gera via tool calls, e eles renderizam ao vivo em um iframe sandboxed.

## Comandos

```bash
npm run setup          # Instala deps + gera Prisma client + roda migrations
npm run dev            # Servidor de dev com Turbopack (localhost:3000)
npm run build          # Build de producao
npm run lint           # ESLint
npm run test           # Vitest (modo watch)
npx vitest run         # Vitest execucao unica
npx vitest run src/lib/__tests__/file-system.test.ts  # Rodar um unico arquivo de teste
npm run db:reset       # Resetar banco SQLite
```

Os scripts `dev` e `build` requerem `node-compat.cjs` via NODE_OPTIONS.

## Arquitetura

### Fluxo do Chat com IA

1. O cliente envia mensagens + estado atual do sistema de arquivos virtual para `POST /api/chat`
2. O servidor adiciona o prompt de geracao (`src/lib/prompts/generation.tsx`), cria um `VirtualFileSystem` a partir dos nodes de arquivo serializados, e chama `streamText` com duas ferramentas
3. A IA usa as ferramentas `str_replace_editor` e `file_manager` para criar/modificar arquivos no sistema de arquivos virtual
4. Os resultados das tool calls sao transmitidos de volta ao cliente; o contexto do chat (`src/lib/contexts/file-system-context.tsx`) intercepta as tool calls e as aplica ao sistema de arquivos virtual do lado do cliente
5. Para usuarios autenticados com um projeto, o estado final e persistido no SQLite via Prisma

### Modulos Principais

- **`src/lib/file-system.ts`** — Sistema de arquivos virtual em memoria. Todas as operacoes de arquivo acontecem aqui; nada e escrito em disco. Serializavel para JSON para persistencia no banco.
- **`src/lib/provider.ts`** — Exporta `getLanguageModel()`. Retorna Claude Haiku 4.5 se `ANTHROPIC_API_KEY` estiver definida, caso contrario retorna um `MockLanguageModel` que simula tool calls multi-step com codigo estatico.
- **`src/lib/tools/str-replace.ts`** — Ferramenta de IA para visualizar, criar e editar arquivos (comandos view/create/str_replace/insert).
- **`src/lib/tools/file-manager.ts`** — Ferramenta de IA para renomear e deletar arquivos.
- **`src/lib/transform/jsx-transformer.ts`** — Compila React JSX para HTML usando Babel standalone para o preview no iframe.
- **`src/lib/contexts/`** — `file-system-context.tsx` gerencia o estado do FS virtual + tratamento de tool calls; `chat-context.tsx` encapsula o hook `useChat` do AI SDK.

### Layout da UI

A UI principal (`src/app/main-content.tsx`) usa `react-resizable-panels` com:
- Painel esquerdo (35%): Interface de chat (`src/components/chat/`)
- Painel direito (65%): Preview ao vivo (iframe) ou visualizacao de Codigo (Monaco editor + arvore de arquivos)

### Autenticacao e Dados

- Autenticacao baseada em JWT com cookies HTTP-only (`src/lib/auth.ts`)
- Server actions em `src/actions/` tratam cadastro/login/logout e CRUD de projetos
- `src/middleware.ts` protege rotas de API que requerem autenticacao
- Usuarios anonimos podem usar a ferramenta; o trabalho e rastreado no localStorage (`src/lib/anon-work-tracker.ts`)
- Banco de dados: SQLite via Prisma. O schema do banco esta detalhado em `prisma/schema.prisma` — consulte-o sempre que precisar entender a estrutura dos dados armazenados. Mensagens e estado do sistema de arquivos armazenados como strings JSON no modelo Project.

### Alias de Caminho

`@/*` mapeia para `./src/*` (configurado no tsconfig.json).

## Variaveis de Ambiente

- `ANTHROPIC_API_KEY` — Opcional. Sem ela, o provider mock retorna codigo estatico gerado.
- `JWT_SECRET` — Para assinar tokens de sessao.

## Testes

Os testes usam Vitest com ambiente jsdom, React Testing Library e `@vitejs/plugin-react`. Arquivos de teste ficam em diretorios `__tests__/` adjacentes ao codigo que testam.
