# Políticas de Row-Level Security (RLS)

Este documento descreve as políticas de segurança implementadas no banco de dados Supabase.

## Visão Geral

O Row-Level Security (RLS) foi habilitado em todas as tabelas do banco de dados para proteger contra acesso não autorizado. As políticas foram configuradas considerando que:

- O projeto usa **NextAuth** para autenticação (não Supabase Auth)
- O **Prisma** usa conexão direta ao PostgreSQL via `DATABASE_URL`
- Há rotas **públicas** (`/campeonatos`) e **protegidas** (`/admin/*`)

## Função Auxiliar

### `is_privileged_connection()`

Esta função verifica se a conexão atual tem permissões privilegiadas:

- Retorna `true` para conexões `service_role` (via Supabase client)
- Retorna `false` para conexões públicas ou anônimas

**Nota Importante**: Como o Prisma usa conexão direta com credenciais de admin, essas conexões podem ter permissões de superuser que bypassam RLS automaticamente. O RLS protege principalmente contra acesso via Supabase client ou outras conexões não privilegiadas.

## Políticas por Tabela

### 1. `users` (Privada)

- **SELECT**: Apenas conexões privilegiadas
- **INSERT/UPDATE/DELETE**: Apenas conexões privilegiadas

**Justificativa**: Dados de usuários são sensíveis e devem ser acessíveis apenas pelo sistema administrativo.

### 2. `categories` (Pública para leitura)

- **SELECT**:
  - Público: categorias com `active = true`
  - Privilegiado: todas as categorias
- **INSERT/UPDATE/DELETE**: Apenas conexões privilegiadas

**Justificativa**: Categorias ativas devem ser visíveis publicamente para inscrições, mas apenas admins podem gerenciá-las.

### 3. `championships` (Parcialmente pública)

- **SELECT**:
  - Público: campeonatos com `status = 'OPEN'`
  - Privilegiado: todos os campeonatos
- **INSERT/UPDATE/DELETE**: Apenas conexões privilegiadas

**Justificativa**: Campeonatos abertos devem ser visíveis para inscrições públicas, mas apenas admins podem criar/modificar.

### 4. `teams` (Parcialmente pública)

- **SELECT**:
  - Público: times com `status = 'APPROVED'` de campeonatos abertos
  - Privilegiado: todos os times
- **INSERT**:
  - Público: apenas com `status = 'PENDING'` (inscrições)
  - Privilegiado: qualquer status
- **UPDATE/DELETE**: Apenas conexões privilegiadas

**Justificativa**: Permite inscrições públicas (criação de times pendentes), mas apenas admins podem aprovar/rejeitar ou modificar times existentes.

### 5. `players` (Parcialmente pública)

- **SELECT**:
  - Público: jogadores de times aprovados em campeonatos abertos
  - Privilegiado: todos os jogadores
- **INSERT**:
  - Público: apenas para times com `status = 'PENDING'` (inscrições)
  - Privilegiado: qualquer time
- **UPDATE/DELETE**: Apenas conexões privilegiadas

**Justificativa**: Permite adicionar jogadores durante inscrições, mas apenas admins podem modificar dados de jogadores.

### 6. `matches` (Parcialmente pública)

- **SELECT**:
  - Público: partidas de campeonatos abertos
  - Privilegiado: todas as partidas
- **INSERT/UPDATE/DELETE**: Apenas conexões privilegiadas

**Justificativa**: Partidas de campeonatos abertos devem ser visíveis publicamente, mas apenas admins podem criar/modificar partidas.

### 7. `match_events` (Parcialmente pública)

- **SELECT**:
  - Público: eventos de partidas de campeonatos abertos
  - Privilegiado: todos os eventos
- **INSERT/UPDATE/DELETE**: Apenas conexões privilegiadas

**Justificativa**: Eventos de partidas públicas devem ser visíveis, mas apenas admins podem criar/modificar eventos.

## Como Testar as Políticas RLS

### 1. Verificar se RLS está habilitado

No Supabase Dashboard:

1. Acesse **Authentication** > **Policies**
2. Verifique se todas as tabelas mostram "RLS Enabled"

### 2. Testar acesso público

Use o Supabase client com a chave anônima (`anon` key):

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Deve funcionar: ler campeonatos abertos
const { data: championships } = await supabase
  .from("championships")
  .select("*")
  .eq("status", "OPEN");

// Deve falhar: ler campeonatos fechados
const { data: closed } = await supabase
  .from("championships")
  .select("*")
  .neq("status", "OPEN");
// Deve retornar vazio ou erro

// Deve funcionar: criar time pendente (inscrição)
const { data: team } = await supabase.from("teams").insert({
  championshipId: "...",
  name: "Time Teste",
  status: "PENDING",
  // ...
});

// Deve falhar: criar time aprovado
const { error } = await supabase.from("teams").insert({
  championshipId: "...",
  name: "Time Teste",
  status: "APPROVED", // Não permitido para público
  // ...
});
// Deve retornar erro de política
```

### 3. Testar acesso privilegiado

Use o Supabase client com a chave de service role (apenas em server-side):

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ NUNCA exponha no client
);

// Deve funcionar: ler qualquer campeonato
const { data } = await supabase.from("championships").select("*");

// Deve funcionar: criar/modificar qualquer registro
const { data: team } = await supabase.from("teams").insert({
  championshipId: "...",
  name: "Time Admin",
  status: "APPROVED", // Permitido para service role
  // ...
});
```

### 4. Verificar via Prisma

Como o Prisma usa conexão direta com credenciais de admin, todas as queries devem funcionar normalmente (bypass RLS). Isso é esperado e necessário para o funcionamento do sistema administrativo.

## Proteções Adicionais

Lembre-se que o RLS é uma **camada adicional** de segurança. As proteções principais continuam sendo:

1. **Middleware do Next.js**: Protege rotas administrativas
2. **Server Actions/API Routes**: Verificam sessão antes de executar operações
3. **RLS**: Protege contra acesso direto ao banco via Supabase client ou outras conexões

## Manutenção

### Adicionar nova política

1. Crie uma nova migration:

   ```bash
   npx prisma migrate dev --name add_new_policy
   ```

2. Adicione a política no arquivo SQL:

   ```sql
   CREATE POLICY "policy_name" ON "table_name"
     FOR SELECT
     USING (condition);
   ```

3. Aplique a migration:
   ```bash
   npx prisma migrate deploy
   ```

### Remover política

```sql
DROP POLICY IF EXISTS "policy_name" ON "table_name";
```

## Troubleshooting

### Problema: Queries do Prisma não funcionam

**Solução**: Verifique se a `DATABASE_URL` está usando credenciais de admin. O Prisma precisa de permissões elevadas para funcionar corretamente.

### Problema: Acesso público não funciona

**Solução**:

1. Verifique se RLS está habilitado na tabela
2. Verifique se há pelo menos uma política que permite o acesso desejado
3. Verifique se está usando a chave `anon` (não `service_role`)

### Problema: Políticas muito restritivas

**Solução**: Ajuste as condições nas políticas ou adicione políticas adicionais que permitam o acesso necessário.

## Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
