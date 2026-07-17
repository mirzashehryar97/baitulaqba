type ApiDataResponse<T> = {
  data?: T;
  error?: string;
};

export async function fetchApiData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json().catch(() => null)) as ApiDataResponse<T> | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Could not load data.');
  }

  if (!body || body.data === undefined) {
    throw new Error('API response did not include data.');
  }

  return body.data;
}
