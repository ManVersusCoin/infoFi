export default async function handler(req, res) {
  // Autorise les requêtes CORS (utile pour tests, pas strictement nécessaire si ton front est sur le même domaine)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Répond correctement aux requêtes OPTIONS (préflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { handle } = req.query;

  if (!handle) {
    return res.status(400).json({ error: "Missing handle" });
  }

  try {
    const response = await fetch(`https://www.xeet.ai/api/user/handle/${handle}`);

    // Vérifie que la réponse est OK
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Xeet API returned status ${response.status}`,
      });
    }

    // Tente de parser le JSON
    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      console.error("Xeet API returned non-JSON:", text.slice(0, 100));
      return res.status(500).json({ error: "Invalid JSON from Xeet API" });
    }
  } catch (error) {
    console.error("Proxy Xeet error:", error);
    return res.status(500).json({ error: "Failed to fetch Xeet data" });
  }
}
