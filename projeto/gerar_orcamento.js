const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, HeadingLevel, LevelFormat, Header, Footer, PageNumber,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
const path = require('path');

// argv[2] pode ser caminho de arquivo .json ou JSON inline
const arg2 = process.argv[2];
const data = (arg2 && arg2.endsWith('.json'))
  ? JSON.parse(require('fs').readFileSync(arg2, 'utf8'))
  : JSON.parse(arg2);

const {
  empresa, telefone, email, logoBase64, logoType,
  cliente, projeto, descricao, requisitos,
  equipe, impostoPerc, prolaborePerc, lucroPerc,
  dataOrcamento, validade
} = data;

// ---- Cores ----
const COR_PRIMARIA = "1A3C5E";
const COR_ACENTO   = "E8622A";
const COR_CLARO    = "EEF3F8";
const COR_TEXTO    = "1C1C1C";
const BRANCO       = "FFFFFF";

// ---- Helpers ----
const bordaNenhuma = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};
const bordaTabela = {
  top:    { style: BorderStyle.SINGLE, size: 1, color: "D0D8E4" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D8E4" },
  left:   { style: BorderStyle.SINGLE, size: 1, color: "D0D8E4" },
  right:  { style: BorderStyle.SINGLE, size: 1, color: "D0D8E4" },
};

function celula(children, opts = {}) {
  return new TableCell({
    borders: opts.semBorda ? bordaNenhuma : bordaTabela,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR } : undefined,
    verticalAlign: opts.vAlign || VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children,
  });
}

function txt(text, opts = {}) {
  return new TextRun({
    text,
    bold: opts.bold || false,
    color: opts.color || COR_TEXTO,
    size: opts.size || 20,
    font: "Calibri",
    italics: opts.italic || false,
  });
}

function par(children, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.spaceBefore || 0, after: opts.spaceAfter || 60 },
    border: opts.borderBottom ? {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COR_ACENTO, space: 4 }
    } : undefined,
    children: Array.isArray(children) ? children : [children],
  });
}

function secaoTitulo(texto) {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COR_PRIMARIA, space: 3 } },
    children: [txt(texto, { bold: true, size: 26, color: COR_PRIMARIA })],
  });
}

// ---- Cálculos financeiros ----
const totalHoras = equipe.reduce((acc, m) => acc + (m.horas * m.quantidade), 0);
const totalBruto = equipe.reduce((acc, m) => acc + (m.horas * m.quantidade * m.valorHora), 0);
const vlImposto  = totalBruto * (impostoPerc / 100);
const vlProlabore = totalBruto * (prolaborePerc / 100);
const vlLucro    = totalBruto * (lucroPerc / 100);
const totalFinal = totalBruto + vlImposto + vlProlabore + vlLucro;

function moeda(v) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---- Header com logo + nome da empresa ----
function buildHeader() {
  const headerChildren = [];

  if (logoBase64) {
    const logoBuffer = Buffer.from(logoBase64, 'base64');
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [
          new ImageRun({
            data: logoBuffer,
            type: logoType || 'png',
            transformation: { width: 120, height: 60 },
          }),
        ],
      })
    );
  }

  headerChildren.push(
    new Paragraph({
      spacing: { before: logoBase64 ? 60 : 0, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: COR_ACENTO, space: 2 } },
      children: [
        txt(empresa, { bold: true, size: 28, color: COR_PRIMARIA }),
      ],
    })
  );

  const contatos = [];
  if (telefone) contatos.push(txt(`Tel: ${telefone}`, { size: 16, color: "666666" }));
  if (email) {
    if (contatos.length) contatos.push(txt('   |   ', { size: 16, color: "AAAAAA" }));
    contatos.push(txt(`E-mail: ${email}`, { size: 16, color: "666666" }));
  }
  if (contatos.length) {
    headerChildren.push(new Paragraph({
      spacing: { before: 40, after: 0 },
      children: contatos,
    }));
  }

  return new Header({ children: headerChildren });
}

// ---- Footer ----
function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        spacing: { before: 100, after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 2 } },
        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
        children: [
          txt(`${empresa} — Proposta Comercial Confidencial`, { size: 16, color: "999999" }),
          txt('\t', { size: 16 }),
          txt('Pág. ', { size: 16, color: "999999" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999", font: "Calibri" }),
        ],
      }),
    ],
  });
}

// ---- Tabela da equipe ----
function buildTabelaEquipe() {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      celula([par([txt('Função', { bold: true, size: 18, color: BRANCO })])], { bg: COR_PRIMARIA, width: 3200 }),
      celula([par([txt('Qtd.', { bold: true, size: 18, color: BRANCO })], { align: AlignmentType.CENTER })], { bg: COR_PRIMARIA, width: 800 }),
      celula([par([txt('Horas', { bold: true, size: 18, color: BRANCO })], { align: AlignmentType.CENTER })], { bg: COR_PRIMARIA, width: 1000 }),
      celula([par([txt('Valor/h', { bold: true, size: 18, color: BRANCO })], { align: AlignmentType.RIGHT })], { bg: COR_PRIMARIA, width: 1680 }),
      celula([par([txt('Subtotal', { bold: true, size: 18, color: BRANCO })], { align: AlignmentType.RIGHT })], { bg: COR_PRIMARIA, width: 2680 }),
    ],
  });

  const rows = equipe.map((m, i) => {
    const subtotal = m.horas * m.quantidade * m.valorHora;
    const bg = i % 2 === 0 ? BRANCO : COR_CLARO;
    return new TableRow({
      children: [
        celula([par([txt(m.funcao, { size: 18 })])], { bg, width: 3200 }),
        celula([par([txt(String(m.quantidade), { size: 18 })], { align: AlignmentType.CENTER })], { bg, width: 800 }),
        celula([par([txt(String(m.horas), { size: 18 })], { align: AlignmentType.CENTER })], { bg, width: 1000 }),
        celula([par([txt(moeda(m.valorHora), { size: 18 })], { align: AlignmentType.RIGHT })], { bg, width: 1680 }),
        celula([par([txt(moeda(subtotal), { size: 18 })], { align: AlignmentType.RIGHT })], { bg, width: 2680 }),
      ],
    });
  });

  // Linha total equipe
  const totalRow = new TableRow({
    children: [
      celula([par([txt('Total da Equipe', { bold: true, size: 18, color: BRANCO })])], { bg: COR_ACENTO, width: 3200 }),
      celula([par([txt('', { size: 18 })])], { bg: COR_ACENTO, width: 800 }),
      celula([par([txt(String(totalHoras) + 'h', { bold: true, size: 18, color: BRANCO })], { align: AlignmentType.CENTER })], { bg: COR_ACENTO, width: 1000 }),
      celula([par([txt('', { size: 18 })])], { bg: COR_ACENTO, width: 1680 }),
      celula([par([txt(moeda(totalBruto), { bold: true, size: 18, color: BRANCO })], { align: AlignmentType.RIGHT })], { bg: COR_ACENTO, width: 2680 }),
    ],
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3200, 800, 1000, 1680, 2680],
    rows: [headerRow, ...rows, totalRow],
  });
}

// ---- Tabela financeira ----
function buildTabelaFinanceiro() {
  const linhas = [
    { label: 'Custo da Equipe (base)',        valor: totalBruto,   bg: COR_CLARO, bold: false },
    { label: `Impostos (${impostoPerc}%)`,     valor: vlImposto,    bg: BRANCO,    bold: false },
    { label: `Pró-labore (${prolaborePerc}%)`, valor: vlProlabore,  bg: COR_CLARO, bold: false },
    { label: `Margem de Lucro (${lucroPerc}%)`,valor: vlLucro,      bg: BRANCO,    bold: false },
  ];

  const rows = linhas.map(l =>
    new TableRow({
      children: [
        celula([par([txt(l.label, { size: 19, bold: l.bold })])], { bg: l.bg, width: 6880 }),
        celula([par([txt(moeda(l.valor), { size: 19, bold: l.bold })], { align: AlignmentType.RIGHT })], { bg: l.bg, width: 2480 }),
      ],
    })
  );

  const totalRow = new TableRow({
    children: [
      celula([par([txt('VALOR TOTAL DO PROJETO', { bold: true, size: 22, color: BRANCO })])], { bg: COR_PRIMARIA, width: 6880 }),
      celula([par([txt(moeda(totalFinal), { bold: true, size: 22, color: BRANCO })], { align: AlignmentType.RIGHT })], { bg: COR_PRIMARIA, width: 2480 }),
    ],
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [6880, 2480],
    rows: [...rows, totalRow],
  });
}

// ---- Tabela de requisitos ----
function buildTabelaRequisitos() {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      celula([par([txt('#', { bold: true, size: 18, color: BRANCO })], { align: AlignmentType.CENTER })], { bg: COR_PRIMARIA, width: 600 }),
      celula([par([txt('Requisito', { bold: true, size: 18, color: BRANCO })])], { bg: COR_PRIMARIA, width: 3200 }),
      celula([par([txt('Descrição', { bold: true, size: 18, color: BRANCO })])], { bg: COR_PRIMARIA, width: 5560 }),
    ],
  });

  const rows = requisitos.map((r, i) => {
    const bg = i % 2 === 0 ? BRANCO : COR_CLARO;
    return new TableRow({
      children: [
        celula([par([txt(String(i + 1), { size: 18 })], { align: AlignmentType.CENTER })], { bg, width: 600 }),
        celula([par([txt(r.nome, { size: 18, bold: true })])], { bg, width: 3200 }),
        celula([par([txt(r.descricao, { size: 18 })])], { bg, width: 5560 }),
      ],
    });
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [600, 3200, 5560],
    rows: [headerRow, ...rows],
  });
}

// ---- Info box: cliente + projeto ----
function buildInfoBox() {
  const rows = [
    ['Cliente', cliente],
    ['Projeto', projeto],
    ['Data do Orçamento', dataOrcamento],
    ['Validade da Proposta', validade],
  ].map(([label, valor], i) => {
    const bg = i % 2 === 0 ? COR_CLARO : BRANCO;
    return new TableRow({
      children: [
        celula([par([txt(label, { bold: true, size: 19, color: COR_PRIMARIA })])], { bg, width: 2800 }),
        celula([par([txt(valor || '—', { size: 19 })])], { bg, width: 6560 }),
      ],
    });
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows,
  });
}

// ---- Documento ----
async function gerarDocumento() {
  const children = [
    // Título do documento
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [
        txt('PROPOSTA COMERCIAL', { bold: true, size: 40, color: COR_PRIMARIA }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COR_ACENTO, space: 4 } },
      children: [txt('Orçamento de Desenvolvimento de Software', { size: 22, color: "666666", italic: true })],
    }),

    // Dados do projeto
    secaoTitulo('Identificação do Projeto'),
    new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
    buildInfoBox(),

    // Descrição
    ...(descricao ? [
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }),
      secaoTitulo('Descrição do Projeto'),
      par([txt(descricao, { size: 20 })], { spaceBefore: 100, spaceAfter: 100 }),
    ] : []),

    // Requisitos
    new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }),
    secaoTitulo('Escopo e Requisitos'),
    new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
    buildTabelaRequisitos(),

    // Equipe
    new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),
    secaoTitulo('Composição da Equipe'),
    new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
    buildTabelaEquipe(),

    // Financeiro
    new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),
    secaoTitulo('Resumo Financeiro'),
    new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
    buildTabelaFinanceiro(),

    // Observações
    new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),
    secaoTitulo('Condições Gerais'),
    par([txt('• Este orçamento é válido por ' + validade + ' a partir da data de emissão.', { size: 20 })], { spaceBefore: 80 }),
    par([txt('• Os valores acima não incluem licenças de terceiros, hospedagem ou infraestrutura.', { size: 20 })]),
    par([txt('• O prazo de execução será definido em contrato após aprovação desta proposta.', { size: 20 })]),
    par([txt('• Qualquer alteração de escopo deverá ser formalizada por aditivo contratual.', { size: 20 })]),

    // Assinatura
    new Paragraph({ spacing: { before: 400, after: 0 }, children: [] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4320, 720, 4320],
      rows: [
        new TableRow({
          children: [
            celula([
              new Paragraph({ spacing: { before: 0, after: 0 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 4 } }, children: [] }),
              par([txt(empresa, { bold: true, size: 18, color: COR_PRIMARIA })], { align: AlignmentType.CENTER }),
              par([txt('Responsável Técnico', { size: 16, color: "777777" })], { align: AlignmentType.CENTER }),
            ], { semBorda: true, width: 4320 }),
            celula([par([txt('')])], { semBorda: true, width: 720 }),
            celula([
              new Paragraph({ spacing: { before: 0, after: 0 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 4 } }, children: [] }),
              par([txt(cliente, { bold: true, size: 18, color: COR_PRIMARIA })], { align: AlignmentType.CENTER }),
              par([txt('Cliente / Contratante', { size: 16, color: "777777" })], { align: AlignmentType.CENTER }),
            ], { semBorda: true, width: 4320 }),
          ],
        }),
      ],
    }),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20, color: COR_TEXTO } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1000, bottom: 1200, left: 1000 },
        },
      },
      headers: { default: buildHeader() },
      footers: { default: buildFooter() },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = process.argv[3] || '/mnt/user-data/outputs/orcamento.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('OK:' + outPath);
}

gerarDocumento().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
