-- ============================================
-- Enable Row-Level Security (RLS) on all tables
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "championships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "matches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_events" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Função auxiliar para verificar se é conexão privilegiada
-- ============================================
-- Esta função verifica se a conexão atual tem permissões privilegiadas
-- Conexões diretas do Prisma (com credenciais de admin) ou service_role
-- podem ter acesso completo
-- 
-- NOTA: Como o Prisma usa conexão direta com credenciais de admin,
-- essas conexões podem ter permissões de superuser que bypassam RLS.
-- Esta função é útil para políticas que precisam diferenciar entre
-- acesso público e acesso administrativo quando usando Supabase client.
CREATE OR REPLACE FUNCTION is_privileged_connection()
RETURNS boolean AS $$
DECLARE
  jwt_claims jsonb;
  user_role text;
BEGIN
  -- Tenta obter claims do JWT (quando usando Supabase client)
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
    user_role := jwt_claims->>'role';
    
    -- Service role tem acesso completo
    IF user_role = 'service_role' THEN
      RETURN true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Se não houver JWT (conexão direta), verifica o role do PostgreSQL
    -- Conexões diretas do Prisma geralmente usam role 'postgres' ou similar
    -- que tem permissões de superuser (bypass RLS automaticamente)
    -- Mas ainda aplicamos políticas para proteger contra acesso não autorizado
    RETURN false;
  END;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICAS PARA TABELA: users
-- ============================================
-- Privada: apenas admin (service role) pode acessar
-- Usuários não podem ver outros usuários

-- SELECT: Apenas service role pode ler
CREATE POLICY "users_select_service_role" ON "users"
  FOR SELECT
  USING (is_privileged_connection());

-- INSERT/UPDATE/DELETE: Apenas service role
CREATE POLICY "users_insert_service_role" ON "users"
  FOR INSERT
  WITH CHECK (is_privileged_connection());

CREATE POLICY "users_update_service_role" ON "users"
  FOR UPDATE
  USING (is_privileged_connection())
  WITH CHECK (is_privileged_connection());

CREATE POLICY "users_delete_service_role" ON "users"
  FOR DELETE
  USING (is_privileged_connection());

-- ============================================
-- POLÍTICAS PARA TABELA: categories
-- ============================================
-- Pública para leitura (categorias ativas)
-- Admin para escrita

-- SELECT: Público pode ver categorias ativas, service role vê todas
CREATE POLICY "categories_select_public" ON "categories"
  FOR SELECT
  USING ("active" = true OR is_privileged_connection());

-- INSERT/UPDATE/DELETE: Apenas service role
CREATE POLICY "categories_insert_service_role" ON "categories"
  FOR INSERT
  WITH CHECK (is_privileged_connection());

CREATE POLICY "categories_update_service_role" ON "categories"
  FOR UPDATE
  USING (is_privileged_connection())
  WITH CHECK (is_privileged_connection());

CREATE POLICY "categories_delete_service_role" ON "categories"
  FOR DELETE
  USING (is_privileged_connection());

-- ============================================
-- POLÍTICAS PARA TABELA: championships
-- ============================================
-- Pública para leitura de campeonatos abertos
-- Service role vê todos

-- SELECT: Público vê campeonatos OPEN, service role vê todos
CREATE POLICY "championships_select_public" ON "championships"
  FOR SELECT
  USING ("status" = 'OPEN' OR is_privileged_connection());

-- INSERT/UPDATE/DELETE: Apenas service role
CREATE POLICY "championships_insert_service_role" ON "championships"
  FOR INSERT
  WITH CHECK (is_privileged_connection());

CREATE POLICY "championships_update_service_role" ON "championships"
  FOR UPDATE
  USING (is_privileged_connection())
  WITH CHECK (is_privileged_connection());

CREATE POLICY "championships_delete_service_role" ON "championships"
  FOR DELETE
  USING (is_privileged_connection());

-- ============================================
-- POLÍTICAS PARA TABELA: teams
-- ============================================
-- Pública para leitura de times aprovados de campeonatos abertos
-- Pública para INSERT (inscrições) - apenas com status PENDING
-- Service role vê todos e pode modificar

-- SELECT: Público vê times aprovados de campeonatos abertos, service role vê todos
CREATE POLICY "teams_select_public" ON "teams"
  FOR SELECT
  USING (
    -- Service role vê tudo
    is_privileged_connection()
    OR
    -- Público vê times aprovados de campeonatos abertos
    (
      "status" = 'APPROVED'
      AND EXISTS (
        SELECT 1 FROM "championships"
        WHERE "championships"."id" = "teams"."championshipId"
        AND "championships"."status" = 'OPEN'
      )
    )
  );

-- INSERT: Público pode criar times com status PENDING (inscrições), service role pode criar qualquer
CREATE POLICY "teams_insert_public_pending" ON "teams"
  FOR INSERT
  WITH CHECK (
    is_privileged_connection()
    OR "status" = 'PENDING'
  );

-- UPDATE/DELETE: Apenas service role
CREATE POLICY "teams_update_service_role" ON "teams"
  FOR UPDATE
  USING (is_privileged_connection())
  WITH CHECK (is_privileged_connection());

CREATE POLICY "teams_delete_service_role" ON "teams"
  FOR DELETE
  USING (is_privileged_connection());

-- ============================================
-- POLÍTICAS PARA TABELA: players
-- ============================================
-- Pública para leitura de jogadores de times aprovados em campeonatos abertos
-- Pública para INSERT (inscrições) - apenas para times com status PENDING
-- Service role vê todos e pode modificar

-- SELECT: Público vê jogadores de times aprovados de campeonatos abertos, service role vê todos
CREATE POLICY "players_select_public" ON "players"
  FOR SELECT
  USING (
    -- Service role vê tudo
    is_privileged_connection()
    OR
    -- Público vê jogadores de times aprovados de campeonatos abertos
    EXISTS (
      SELECT 1 FROM "teams"
      INNER JOIN "championships" ON "championships"."id" = "teams"."championshipId"
      WHERE "teams"."id" = "players"."teamId"
      AND "teams"."status" = 'APPROVED'
      AND "championships"."status" = 'OPEN'
    )
  );

-- INSERT: Público pode criar jogadores para times PENDING (inscrições), service role pode criar qualquer
CREATE POLICY "players_insert_public_pending" ON "players"
  FOR INSERT
  WITH CHECK (
    is_privileged_connection()
    OR EXISTS (
      SELECT 1 FROM "teams"
      WHERE "teams"."id" = "players"."teamId"
      AND "teams"."status" = 'PENDING'
    )
  );

-- UPDATE/DELETE: Apenas service role
CREATE POLICY "players_update_service_role" ON "players"
  FOR UPDATE
  USING (is_privileged_connection())
  WITH CHECK (is_privileged_connection());

CREATE POLICY "players_delete_service_role" ON "players"
  FOR DELETE
  USING (is_privileged_connection());

-- ============================================
-- POLÍTICAS PARA TABELA: matches
-- ============================================
-- Pública para leitura de partidas de campeonatos abertos
-- Service role vê todos e pode modificar

-- SELECT: Público vê partidas de campeonatos abertos, service role vê todos
CREATE POLICY "matches_select_public" ON "matches"
  FOR SELECT
  USING (
    is_privileged_connection()
    OR EXISTS (
      SELECT 1 FROM "championships"
      WHERE "championships"."id" = "matches"."championshipId"
      AND "championships"."status" = 'OPEN'
    )
  );

-- INSERT/UPDATE/DELETE: Apenas service role
CREATE POLICY "matches_insert_service_role" ON "matches"
  FOR INSERT
  WITH CHECK (is_privileged_connection());

CREATE POLICY "matches_update_service_role" ON "matches"
  FOR UPDATE
  USING (is_privileged_connection())
  WITH CHECK (is_privileged_connection());

CREATE POLICY "matches_delete_service_role" ON "matches"
  FOR DELETE
  USING (is_privileged_connection());

-- ============================================
-- POLÍTICAS PARA TABELA: match_events
-- ============================================
-- Pública para leitura de eventos de partidas públicas
-- Service role vê todos e pode modificar

-- SELECT: Público vê eventos de partidas de campeonatos abertos, service role vê todos
CREATE POLICY "match_events_select_public" ON "match_events"
  FOR SELECT
  USING (
    is_privileged_connection()
    OR EXISTS (
      SELECT 1 FROM "matches"
      INNER JOIN "championships" ON "championships"."id" = "matches"."championshipId"
      WHERE "matches"."id" = "match_events"."matchId"
      AND "championships"."status" = 'OPEN'
    )
  );

-- INSERT/UPDATE/DELETE: Apenas service role
CREATE POLICY "match_events_insert_service_role" ON "match_events"
  FOR INSERT
  WITH CHECK (is_privileged_connection());

CREATE POLICY "match_events_update_service_role" ON "match_events"
  FOR UPDATE
  USING (is_privileged_connection())
  WITH CHECK (is_privileged_connection());

CREATE POLICY "match_events_delete_service_role" ON "match_events"
  FOR DELETE
  USING (is_privileged_connection());
