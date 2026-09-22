'use server';

interface Suburb {
  name: string;
  postcode: number;
  state: {
    abbreviation: string;
  };
}

export async function fetchSuburbs(query: string): Promise<Suburb[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const apiKey = process.env.GEOMAP_API;

    // Step 1: autocomplete to get suburb names + place_ids
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&components=country:au&key=${apiKey}`;
    const autocompleteRes = await fetch(autocompleteUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });

    if (!autocompleteRes.ok) return [];

    const autocompleteData = await autocompleteRes.json();

    if (!Array.isArray(autocompleteData.predictions) || autocompleteData.predictions.length === 0) {
      return [];
    }

    const predictions = autocompleteData.predictions.slice(0, 5);

    // Step 2: geocode each place_id in parallel to get postcodes
    const results = await Promise.all(
      predictions.map(async (prediction: any) => {
        const name: string = prediction.structured_formatting?.main_text ?? '';
        const stateFromTerms: string = prediction.terms?.[1]?.value ?? '';

        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${prediction.place_id}&key=${apiKey}`;
          const geocodeRes = await fetch(geocodeUrl, { cache: 'no-store' });
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
          } as Suburb;
        } catch {
          return null;
        }
      })
    );

    return results.filter((s): s is Suburb => s !== null);
  } catch {
    return [];
  }
}
