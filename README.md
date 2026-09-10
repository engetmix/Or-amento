# Almoxarifado — Guia de configuração e publicação

Sistema de controle de estoque com dois acessos:
- **Visitante** (sem senha): pesquisa itens e envia requisições de saída.
- **Almoxarife** (com senha): cadastra itens, categorias, funções e unidades; confirma/recusa requisições; vê histórico.

## 1. Configurar o banco de dados (Supabase)

1. Abra o projeto que você criou no [supabase.com](https://supabase.com).
2. No menu lateral, vá em **SQL Editor** → **New query**.
3. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo, cole no editor e clique em **Run**.
   - Isso cria todas as tabelas, as regras de segurança (RLS) e alguns exemplos de categoria/função/unidade (pode apagar depois).
4. Crie a conta do almoxarife: vá em **Authentication** → **Users** → **Add user** → **Create new user**. Marque a opção para confirmar o e-mail automaticamente (ou desative a confirmação por e-mail em Authentication → Settings, já que o sistema não terá fluxo de "esqueci minha senha" configurado). Anote o e-mail e a senha — é isso que o almoxarife vai usar para entrar.
5. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**. Vamos usá-las no próximo passo.

## 2. Subir o código no GitHub

1. Crie um repositório novo no GitHub (ex: `almoxarifado`).
2. Suba os arquivos deste projeto para o repositório (pelo site do GitHub, arrastando os arquivos, ou usando `git push` se preferir linha de comando).

## 3. Publicar na Vercel

1. Em [vercel.com](https://vercel.com), clique em **Add New → Project**.
2. Selecione o repositório que você acabou de criar no GitHub.
3. Antes de clicar em "Deploy", abra a seção **Environment Variables** e adicione:
   - `VITE_SUPABASE_URL` → cole a Project URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` → cole a anon public key do Supabase
4. Clique em **Deploy**. Em cerca de 1 minuto, a Vercel gera um link público (ex: `almoxarifado.vercel.app`) — é esse link que você compartilha com todo mundo.

## 4. Testar

- Abra o link gerado. Você verá as duas opções de entrada: **Pesquisar & requisitar** (visitante) e **Sou o almoxarife** (login).
- Entre como almoxarife com o e-mail/senha criados no passo 1.4.
- Vá em **Categorias, funções e unidades** e confira/ajuste os itens.
- Cadastre um item de teste em **Itens** e depois simule uma requisição pela tela de visitante para ver o fluxo completo.

## Rodando localmente (opcional, para você mexer no código)

```bash
npm install
cp .env.example .env   # depois edite o .env com suas chaves do Supabase
npm run dev
```

## Observações

- Toda vez que você atualizar o código no GitHub, a Vercel publica a nova versão automaticamente.
- Não é necessário comprar domínio — o link `.vercel.app` já é público e permanente. Um domínio próprio é só uma melhoria estética futura, se quiser.
- A senha do almoxarife fica protegida pelo Supabase Auth (nunca é exposta no código do site).
