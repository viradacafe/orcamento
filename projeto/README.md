# OrçaSoft 📄
**Sistema de geração de propostas para fábricas de software**

---

## Estrutura do projeto

```
orcasoft/
├── server.js              ← Servidor Express (API + arquivos estáticos)
├── gerar_orcamento.js     ← Gerador do .docx (chamado pelo servidor)
├── sistema_orcamento.html ← Interface web (5 etapas)
├── package.json
└── README.md
```

---

## Instalação

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior

### Passos

```bash
# 1. Entre na pasta do projeto
cd orcasoft

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start
```

O terminal exibirá:
```
✅  OrçaSoft rodando em http://localhost:3000
   Acesse o sistema: http://localhost:3000/sistema_orcamento.html
```

---

## Uso

1. Abra o navegador em **http://localhost:3000/sistema_orcamento.html**
2. Preencha as 5 etapas:
   - **Empresa** — nome, contato e logotipo (papel timbrado)
   - **Projeto** — cliente, nome, datas e requisitos funcionais
   - **Equipe** — perfis com horas e valor/hora
   - **Financeiro** — impostos, pró-labore e margem de lucro
   - **Resumo** — confira e clique em **Gerar Proposta .docx**
3. O download do arquivo Word começa automaticamente.

---

## Documento gerado

O `.docx` inclui:
- Cabeçalho com logotipo e dados da empresa (papel timbrado)
- Identificação do projeto (cliente, datas, validade)
- Descrição do projeto
- Tabela de escopo e requisitos
- Composição da equipe com subtotais por perfil
- Resumo financeiro (base + impostos + pró-labore + lucro = **total final**)
- Condições gerais
- Espaço para assinaturas
- Rodapé com paginação

---

## Personalização

### Mudar a porta
```bash
PORT=8080 npm start
```

### Mudar percentuais padrão
Edite os valores `value=""` nos inputs da **Etapa 4** em `sistema_orcamento.html`.

### Mudar funções pré-definidas da equipe
Edite o array `funcoesPadrao` no `<script>` de `sistema_orcamento.html`.

### Mudar as cores do documento Word
Edite as constantes no topo de `gerar_orcamento.js`:
```js
const COR_PRIMARIA = "1A3C5E";  // azul escuro
const COR_ACENTO   = "E8622A";  // laranja
```

---

## API

### `POST /api/gerar-orcamento`
Recebe JSON com os dados e retorna o arquivo `.docx` como download.

**Corpo esperado:**
```json
{
  "empresa": "Nome da Fábrica",
  "telefone": "(81) 99999-9999",
  "email": "contato@empresa.com.br",
  "logoBase64": "...",
  "logoType": "png",
  "cliente": "Nome do Cliente",
  "projeto": "Nome do Projeto",
  "descricao": "Descrição...",
  "dataOrcamento": "14/04/2026",
  "validade": "30 dias",
  "requisitos": [
    { "nome": "Funcionalidade", "descricao": "Detalhe" }
  ],
  "equipe": [
    { "funcao": "Dev Back-end", "quantidade": 2, "horas": 120, "valorHora": 65 }
  ],
  "impostoPerc": 6,
  "prolaborePerc": 10,
  "lucroPerc": 15
}
```

### `GET /health`
Retorna `{ "status": "ok" }` — útil para monitoramento.

---

## Implantação em produção

Para hospedar em um servidor Linux (VPS, Render, Railway etc.):

```bash
# Instalar PM2 para manter o processo ativo
npm install -g pm2
pm2 start server.js --name orcasoft
pm2 save
pm2 startup
```

Para usar com domínio próprio, configure um **proxy reverso** (Nginx ou Caddy) apontando para `localhost:3000`.
