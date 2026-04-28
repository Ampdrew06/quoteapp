export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { destinationPostcode } = req.body || {};

    if (!destinationPostcode) {
      return res.status(400).json({ error: "Destination postcode is required" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const originPostcode = process.env.BUSINESS_POSTCODE;

    if (!apiKey || !originPostcode) {
      return res.status(500).json({
        error: "Missing GOOGLE_MAPS_API_KEY or BUSINESS_POSTCODE",
      });
    }

    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin: { address: `${originPostcode}, UK` },
          destination: { address: `${destinationPostcode}, UK` },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
          units: "IMPERIAL",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Google Routes API error",
        details: data,
      });
    }

    const route = data.routes?.[0];

    if (!route?.distanceMeters) {
      return res.status(404).json({ error: "No route found", details: data });
    }

    const distanceMiles = route.distanceMeters / 1609.344;

    return res.status(200).json({
      originPostcode,
      destinationPostcode,
      distanceMiles: Number(distanceMiles.toFixed(2)),
      duration: route.duration || null,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Delivery distance lookup failed",
      message: err.message,
    });
  }
}