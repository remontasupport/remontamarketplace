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
    const response = await fetch(
      `https://v0.postcodeapi.com.au/suburbs.json?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store', // Disable caching for real-time results
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    // Return the data (limit to 10 results)
    return Array.isArray(data) ? data.slice(0, 10) : [];
  } catch (error) {
    return [];
  }
}
