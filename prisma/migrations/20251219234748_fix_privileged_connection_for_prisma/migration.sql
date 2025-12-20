-- ============================================
-- Corrigir função is_privileged_connection() para reconhecer conexões do Prisma
-- ============================================
-- O Prisma usa conexões diretas ao PostgreSQL sem JWT, então precisamos
-- verificar se o usuário atual é um superuser ou o usuário 'postgres'
-- que tem permissões administrativas

CREATE OR REPLACE FUNCTION is_privileged_connection()
RETURNS boolean AS $$
DECLARE
  jwt_claims jsonb;
  user_role text;
  current_user_role text;
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
    -- Se não houver JWT (conexão direta do Prisma), verifica o role do PostgreSQL
    -- Conexões diretas do Prisma geralmente usam role 'postgres' ou similar
    -- que tem permissões de superuser (bypass RLS automaticamente)
    -- Mas ainda aplicamos políticas para proteger contra acesso não autorizado
    
    -- Verificar se o usuário atual é um superuser
    -- Isso permite que conexões do Prisma (que usam credenciais de admin) funcionem
    SELECT current_user INTO current_user_role;
    
    -- Se for o usuário 'postgres' (usado pelo Prisma) ou um superuser, permitir
    -- Verificar se é superuser usando pg_has_role
    IF current_user_role = 'postgres' OR 
       EXISTS (
         SELECT 1 FROM pg_roles 
         WHERE rolname = current_user_role 
         AND rolsuper = true
       ) THEN
      RETURN true;
    END IF;
    
    RETURN false;
  END;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
