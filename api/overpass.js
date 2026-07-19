export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  ];

  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    let lastError;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const overpassRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (!overpassRes.ok) {
          lastError = new Error(`Overpass responded ${overpassRes.status}`);
          continue;
        }

        const text = await overpassRes.text();
        const data = JSON.parse(text);
        return res.status(200).json(data);
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    return res.status(502).json({ error: "All Overpass endpoints failed", detail: lastError?.message });
  } catch (err) {
    return res.status(500).json({ error: "Overpass API error", detail: err.message });
  }
}
