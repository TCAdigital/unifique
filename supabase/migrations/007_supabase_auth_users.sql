-- 007_supabase_auth_users.sql
-- Cria usuários no Supabase Auth a partir da tabela usuarios.
-- Isso permite login via supabase.auth.signInWithPassword() sem localStorage.
-- Execute no SQL Editor do Supabase Dashboard.

-- 1. Criar os usuários em auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  u.email,
  crypt(u.password_hash, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('nome', u.nome, 'perfil', u.perfil),
  now(),
  now(),
  '', '', '', ''
FROM usuarios u
WHERE u.ativo = true
ON CONFLICT (email) DO NOTHING;

-- 2. Criar identidades (obrigatório para login email/senha funcionar)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  au.id,
  jsonb_build_object('sub', au.id::text, 'email', au.email),
  'email',
  now(),
  now(),
  now()
FROM auth.users au
INNER JOIN usuarios u ON u.email = au.email
WHERE u.ativo = true
AND NOT EXISTS (
  SELECT 1 FROM auth.identities ai
  WHERE ai.user_id = au.id AND ai.provider = 'email'
);
