# Node 22 obrigatório no Strapi Cloud

O build falha com **"Failed to load native binding"** (@swc/core) quando o Strapi Cloud usa **Node 24**. Este projeto precisa de **Node 22**.

## Como corrigir no Strapi Cloud

A versão do Node **não** fica em Settings → General. Ela fica nas **configurações do ambiente** (ex.: production):

1. Abra o [Strapi Cloud](https://cloud.strapi.io/) e entre no seu projeto.
2. No dropdown **Environment**, selecione o ambiente (ex.: **production**).
3. No menu da esquerda, em **Configuration** (configurações do ambiente), abra **Configuration** (ou a página de configuração do ambiente).
4. Na seção **Basic information**, procure **Node version** e clique no botão de **editar** (ícone de lápis).
5. No diálogo, escolha **Node 22** (ou 22.x) no dropdown e clique em **Save** ou **Save & deploy**.
6. Faça um novo deploy se necessário (Deployments → Deploy ou push no repositório).

**Se não aparecer "Configuration" ou "Node version":** a doc do Strapi Cloud indica que a aba **Environments** (e algumas opções por ambiente) pode ser **Pro/Scale**. No plano **Essential/Free** a interface pode ser diferente. Nesse caso, vale abrir um ticket no [suporte Strapi](https://support.strapi.io) pedindo para usar Node 22 no build ou para habilitar a opção no seu plano.

## O que já está no repositório

- `package.json` → `engines.node`: `"22.x"`
- `package.json` → `volta.node`: `"22.0.0"`
- `.nvmrc`: `22`
- `.node-version`: `22`

Isso garante Node 22 em ambientes que leem esses arquivos (Heroku, Netlify, etc.). No Strapi Cloud, a versão é definida **só pelo dashboard**, não por arquivos do repo.

## Por que Node 24 quebra

O build do admin usa **@swc/core** (via Vite/Strapi). O @swc/core usa um binário nativo (NAPI) que hoje só é publicado para Node até 22. Em Node 24 o carregamento desse binário falha com *"Failed to load native binding"*. Não há fallback WASM publicado no npm para o core; a solução é usar Node 22 no ambiente de build.
