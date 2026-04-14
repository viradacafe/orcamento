const express = require('express');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // serve o HTML estático

// ---- POST /api/gerar-orcamento ----
app.post('/api/gerar-orcamento', (req, res) => {
  const tmpInput  = path.join(os.tmpdir(), `orca_in_${Date.now()}.json`);
  const tmpOutput = path.join(os.tmpdir(), `orca_out_${Date.now()}.docx`);

  try {
    // Salva o payload em arquivo temporário
    fs.writeFileSync(tmpInput, JSON.stringify(req.body), 'utf8');

    // Chama o gerador passando os caminhos como args — sem shell, funciona em qualquer SO
    const result = spawnSync(
      process.execPath, // usa o mesmo Node.js que está rodando o servidor
      [path.join(__dirname, 'gerar_orcamento.js'), tmpInput, tmpOutput],
      { timeout: 30000, encoding: 'utf8' }
    );

    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr || 'Erro desconhecido no gerador');

    const docx = fs.readFileSync(tmpOutput);
    const nomeArquivo = `proposta_${(req.body.cliente || 'cliente').replace(/\s+/g, '_')}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.send(docx);

  } catch (err) {
    console.error('[ERRO]', err.message);
    res.status(500).send('Erro ao gerar documento: ' + err.message);
  } finally {
    try { fs.unlinkSync(tmpInput); } catch {}
    try { fs.unlinkSync(tmpOutput); } catch {}
  }
});

// ---- Health check ----
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅  OrçaSoft rodando em http://localhost:${PORT}`);
  console.log(`   Acesse o sistema: http://localhost:${PORT}/sistema_orcamento.html\n`);
});
