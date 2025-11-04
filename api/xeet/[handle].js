export default async function handler(req, res) {
  const { handle } = req.query;

  try {
    const response = await fetch(`https://www.xeet.ai/api/user/handle/${handle}`);
    const data = await response.json();

    // Permet les appels depuis ton site
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Xeet error:', error);
    res.status(500).json({ error: 'Failed to fetch Xeet data' });
  }
}
