-- Adiciona o perfil "supervisor" à constraint de usuarios
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_perfil_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_perfil_check
  CHECK (perfil IN ('admin','gerente','supervisor','consultor','preVenda'));

NOTIFY pgrst, 'reload schema';
