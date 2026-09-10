import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const apiKey = process.env.GEOMAP_API;

    // Step 1: autocomplete to get suburb names + place_ids
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&components=country:au&key=${apiKey}`;
    const autocompleteRes = await fetch(autocompleteUrl, { headers: { Accept: 'application/json' } });

    if (!autocompleteRes.ok) {
      return NextResponse.json([]);
    }

    const autocompleteData = await autocompleteRes.json();

    if (!Array.isArray(autocompleteData.predictions) || autocompleteData.predictions.length === 0) {
      return NextResponse.json([]);
    }

    const predictions = autocompleteData.predictions.slice(0, 5);

    // Step 2: geocode each place_id in parallel to get postcodes
    const suburbs = await Promise.all(
      predictions.map(async (prediction: any) => {
        const name: string = prediction.structured_formatting?.main_text ?? '';
        const stateFromTerms: string = prediction.terms?.[1]?.value ?? '';

        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${prediction.place_id}&key=${apiKey}`;
          const geocodeRes = await fetch(geocodeUrl);
          const geocodeData = await geocodeRes.json();

          if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) return null;

          type AddressComponent = { long_name: string; short_name: string; types: string[] };
          const components: AddressComponent[] = geocodeData.results[0].address_components;
          const postcode = components.find(c => c.types.includes('postal_code'))?.long_name;
          const stateComp = components.find(c => c.types.includes('administrative_area_level_1'));

          if (!postcode) return null;

          return {
            name,
            postcode: parseInt(postcode, 10),
            state: { abbreviation: stateComp?.short_name ?? stateFromTerms },
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json(suburbs.filter(Boolean));
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
