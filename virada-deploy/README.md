# Virada no Café — Ferramenta de Levantamento e Orçamento

Sistema completo para levantamento de requisitos e geração de propostas comerciais em Word (.docx), com IA integrada.

---

## Estrutura do projeto

```
virada-deploy/
├── api/
│   └── chat.js          ← Proxy seguro para a API da Anthropic
├── public/
│   └── index.html       ← Ferramenta completa (frontend)
├── vercel.json          ← Configuração de rotas da Vercel
└── README.md
```

---

## Deploy na Vercel (passo a passo)

### 1. Pré-requisitos
- Conta gratuita na [Vercel](https://vercel.com)
- Chave de API da Anthropic (obtenha em [console.anthropic.com](https://console.anthropic.com))

### 2. Subir o projeto

**Opção A — Via interface web (mais simples):**
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"** ou **"Deploy from template"**
3. Arraste a pasta `virada-deploy` para o campo de upload  
   _(ou use GitHub: suba o repositório e conecte na Vercel)_

**Opção B — Via CLI:**
```bash
npm install -g vercel
cd virada-deploy
vercel deploy --prod
```

### 3. Configurar a chave da API

Após o deploy, acesse o painel da Vercel:
1. Vá em **Settings → Environment Variables**
2. Clique em **Add**
3. Preencha:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (sua chave da Anthropic)
   - **Environment:** Production (e Preview se quiser)
4. Clique em **Save**
5. Vá em **Deployments** e clique em **Redeploy** para aplicar

### 4. Acessar a ferramenta

Após o redeploy, a ferramenta estará disponível na URL gerada pela Vercel:
```
https://virada-orcamento.vercel.app
```
(o nome exato é definido na Vercel, pode ser personalizado com domínio próprio)

---

## Variáveis de ambiente necessárias

| Variável             | Descrição                        | Obrigatória |
|----------------------|----------------------------------|-------------|
| `ANTHROPIC_API_KEY`  | Chave da API da Anthropic        | Sim         |

---

## Como funciona a segurança

- A chave da API **nunca fica exposta** no HTML ou no código do navegador
- Toda chamada à Anthropic passa pelo proxy `/api/chat` no servidor da Vercel
- O proxy adiciona a chave automaticamente a partir da variável de ambiente
- O front-end chama `/api/chat` (rota relativa, sem chave)

---

## Funcionalidades

- Levantamento de requisitos guiado em 4 etapas
- Montagem do time com cálculo financeiro em tempo real (margem + Simples Nacional)
- Geração de orçamento com IA (etapas, horas por cargo, contexto, arquitetura)
- Exportação de proposta profissional em Word (.docx) com:
  - Logo da Virada no Café
  - Contexto do problema
  - Arquitetura da solução
  - Escopo e etapas detalhadas
  - Resumo financeiro
  - Condições de pagamento
  - Bloco de assinaturas

---

## Suporte

Desenvolvido com Claude — Virada no Café © 2025
