# Unifique — Guia de Hospedagem e Deploy
**Versão:** 2.0 | **Plataforma de Negócios TIC**

---

## 📦 Conteúdo do Pacote

```
unifique_deploy/
├── app/
│   └── index.html          ← Aplicação completa (HTML/CSS/JS, arquivo único)
├── database/
│   └── schema.sql          ← Schema PostgreSQL completo + seed data
├── nginx/
│   └── unifique.conf       ← Config Nginx para produção (HTTPS + gzip)
└── docs/
    └── README.md           ← Este arquivo
```

---

## 🚀 Opção 1 — Hospedagem Estática (mais simples)

### Netlify (recomendado — grátis)
1. Acesse [netlify.com](https://netlify.com) e faça login
2. Arraste a pasta `app/` para a área de deploy
3. Pronto! URL gerada automaticamente (ex: `seu-app.netlify.app`)
4. Para domínio próprio: **Settings → Domain management → Add custom domain**

### Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **Add New → Project**
3. Arraste a pasta `app/` ou conecte ao GitHub
4. Deploy automático

### GitHub Pages (grátis)
```bash
# 1. Crie repositório no GitHub
# 2. Faça upload do arquivo index.html na raiz
# 3. Settings → Pages → Branch: main → / (root) → Save
# URL: https://seu-usuario.github.io/seu-repositorio
```

### Hostinger / Locaweb / UOL Host
1. Acesse o **Painel de Controle** (cPanel ou similar)
2. Abra o **Gerenciador de Arquivos**
3. Navegue até `public_html/`
4. Faça upload do `index.html`
5. Acesse pelo domínio configurado

---

## 🖥️ Opção 2 — VPS com Nginx (produção robusta)

### Requisitos
- Ubuntu 22.04 LTS ou Debian 12
- 1 vCPU, 1 GB RAM mínimo
- Nginx + Certbot (SSL gratuito)
- PostgreSQL 15+ (se usar banco)

### Passo a Passo

#### 1. Instalar dependências
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

#### 2. Criar pasta da aplicação
```bash
sudo mkdir -p /var/www/unifique
sudo chown -R $USER:$USER /var/www/unifique
```

#### 3. Fazer upload do arquivo
```bash
# Via SCP (substitua IP e caminho)
scp app/index.html usuario@SEU_IP:/var/www/unifique/

# Ou via SFTP com FileZilla / WinSCP
```

#### 4. Configurar Nginx
```bash
sudo cp nginx/unifique.conf /etc/nginx/sites-available/unifique

# Editar o domínio no arquivo
sudo nano /etc/nginx/sites-available/unifique
# Substituir "seu-dominio.com.br" pelo seu domínio real

# Ativar o site
sudo ln -s /etc/nginx/sites-available/unifique /etc/nginx/sites-enabled/
sudo nginx -t   # Testar configuração
sudo systemctl reload nginx
```

#### 5. SSL gratuito com Let's Encrypt
```bash
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br
# Seguir instruções interativas
# O Certbot renova automaticamente a cada 90 dias
```

#### 6. Verificar
```bash
sudo systemctl status nginx
curl -I https://seu-dominio.com.br
```

---

## 🐘 Banco de Dados PostgreSQL

### Configuração Inicial
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE unifique ENCODING 'UTF8' LC_COLLATE='pt_BR.UTF-8' TEMPLATE=template0;
CREATE USER unifique_app WITH ENCRYPTED PASSWORD 'SUA_SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE unifique TO unifique_app;
GRANT ALL ON SCHEMA public TO unifique_app;
\q
```

### Executar Schema
```bash
psql -U unifique_app -d unifique -f database/schema.sql
```

### Verificar tabelas criadas
```bash
psql -U unifique_app -d unifique -c "\dt unifique.*"
```

### Saída esperada
```
          List of relations
 Schema  |        Name          | Type  |    Owner
---------+----------------------+-------+--------------
 unifique| ai_agentes           | table | unifique_app
 unifique| ai_execucoes         | table | unifique_app
 unifique| audit_log            | table | unifique_app
 unifique| empresas             | table | unifique_app
 unifique| mensagens            | table | unifique_app
 unifique| negocios             | table | unifique_app
 unifique| okr_dados            | table | unifique_app
 unifique| orcamentos           | table | unifique_app
 unifique| pipeline_snapshots   | table | unifique_app
 unifique| tarefas              | table | unifique_app
 unifique| ti_itens             | table | unifique_app
 unifique| ti_movimentacoes     | table | unifique_app
 unifique| ti_vendas            | table | unifique_app
 unifique| usuarios             | table | unifique_app
(14 rows)
```

---

## 🐳 Opção 3 — Docker (deploy em qualquer servidor)

### docker-compose.yml
```yaml
version: '3.9'

services:
  app:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./app:/usr/share/nginx/html:ro
      - ./nginx/unifique.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/letsencrypt:ro
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: unifique
      POSTGRES_USER: unifique_app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=pt_BR.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro
    ports:
      - "5432:5432"
    restart: always

volumes:
  postgres_data:
```

### Executar com Docker
```bash
# Criar arquivo .env
echo "DB_PASSWORD=sua_senha_forte" > .env

# Subir tudo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

---

## ☁️ Opção 4 — Cloud (AWS / GCP / Azure)

### AWS S3 + CloudFront (estático)
```bash
# Instalar AWS CLI e configurar credenciais
aws s3 mb s3://unifique-app
aws s3 cp app/index.html s3://unifique-app/
aws s3 website s3://unifique-app --index-document index.html
# Configurar CloudFront para HTTPS
```

### Azure Static Web Apps
1. Portal Azure → Create → Static Web App
2. Conectar repositório GitHub com `app/index.html`
3. Deploy automático em cada push

### Google Cloud Run
```bash
gcloud run deploy unifique \
  --image nginx \
  --region southamerica-east1 \
  --allow-unauthenticated
```

---

## 🔒 Segurança em Produção

| Item | Recomendação |
|------|-------------|
| HTTPS | Obrigatório via Let's Encrypt (Certbot) |
| DB Password | Mínimo 24 caracteres, alfanumérico + especiais |
| Backup DB | `pg_dump` diário — armazenar em S3 ou similar |
| Firewall | Liberar apenas 80, 443 e 22 (SSH) |
| SSH | Usar chave pública, desabilitar senha |
| Updates | `sudo apt upgrade -y` semanalmente |
| Logs | Monitorar `/var/log/nginx/unifique_error.log` |

---

## 💾 Backup do Banco

```bash
# Backup manual
pg_dump -U unifique_app unifique > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U unifique_app unifique < backup_20250426.sql

# Agendar backup diário (crontab)
0 3 * * * pg_dump -U unifique_app unifique > /backups/unifique_$(date +\%Y\%m\%d).sql
```

---

## 📞 Suporte

**Plataforma Unifique** — Tecnologia da Informação e Comunicação
- Site: unifique.com.br
- E-mail: ti@redeunifique.com.br

---

*Unifique v2.0 — Agentes de IA + CRM + RevOps*
