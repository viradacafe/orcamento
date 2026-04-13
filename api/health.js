export default function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  res.json({
    key_existe: !!key,
    key_prefixo: key ? key.substring(0, 10) + '...' : 'não encontrada'
  });
}