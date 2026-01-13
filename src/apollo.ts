import { request } from "undici";

export type ApolloOptions = {
  apiKey: string;
  baseUrl?: string; // default https://api.apollo.io/api/v1
};

export interface ApolloResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

export class ApolloClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(opts: ApolloOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? "https://api.apollo.io/api/v1";
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey
      },
      body: JSON.stringify(body)
    });

    if (res.statusCode === 401) {
      throw new Error("Unauthorized: invalid or missing APOLLO_API_KEY");
    }
    if (res.statusCode === 429) {
      const retryAfter = res.headers["retry-after"];
      throw new Error(
        `Rate limited by Apollo (429).${retryAfter ? ` Retry after ${retryAfter}s.` : ""}`
      );
    }
    if (res.statusCode >= 400) {
      const text = await res.body.text();
      throw new Error(`Apollo error ${res.statusCode}: ${text}`);
    }

    return (await res.body.json()) as T;
  }

  private async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await request(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey
      }
    });

    if (res.statusCode === 401) {
      throw new Error("Unauthorized: invalid or missing APOLLO_API_KEY");
    }
    if (res.statusCode === 429) {
      const retryAfter = res.headers["retry-after"];
      throw new Error(
        `Rate limited by Apollo (429).${retryAfter ? ` Retry after ${retryAfter}s.` : ""}`
      );
    }
    if (res.statusCode >= 400) {
      const text = await res.body.text();
      throw new Error(`Apollo error ${res.statusCode}: ${text}`);
    }

    return (await res.body.json()) as T;
  }

  // People search - using mixed_people/api_search (updated endpoint)
  searchPeople(params: Record<string, unknown>) {
    return this.post("/mixed_people/api_search", params);
  }

  // Company/Organization search - using mixed_companies/search
  searchCompanies(params: Record<string, unknown>) {
    return this.post("/mixed_companies/search", params);
  }

  // Enrich person (match) - using people/match with query params
  matchPerson(params: Record<string, unknown>, revealPersonalEmails: boolean = false, revealPhoneNumber: boolean = false) {
    const queryParams = new URLSearchParams({
      reveal_personal_emails: revealPersonalEmails.toString(),
      reveal_phone_number: revealPhoneNumber.toString()
    });
    return this.post(`/people/match?${queryParams}`, params);
  }

  // Enrich company/organization - using organizations/enrich
  matchCompany(params: Record<string, unknown>) {
    return this.post("/organizations/enrich", params);
  }

  // Bulk People Enrichment - using people/bulk_match with query params
  bulkEnrichPeople(params: Record<string, unknown>, revealPersonalEmails: boolean = false, revealPhoneNumber: boolean = false) {
    const queryParams = new URLSearchParams({
      reveal_personal_emails: revealPersonalEmails.toString(),
      reveal_phone_number: revealPhoneNumber.toString()
    });
    return this.post(`/people/bulk_match?${queryParams}`, params);
  }

  // Bulk Organization Enrichment - using organizations/bulk_enrich
  bulkEnrichOrganizations(params: Record<string, unknown>) {
    return this.post("/organizations/bulk_enrich", params);
  }

  // Organization Job Postings
  getOrganizationJobPostings(organizationId: string, params?: Record<string, unknown>) {
    return this.get(`/organizations/${organizationId}/job_postings`);
  }

  // Get Complete Organization Info
  getCompleteOrganizationInfo(organizationId: string) {
    return this.get(`/organizations/${organizationId}`);
  }

  // News Articles Search
  searchNewsArticles(params: Record<string, unknown>) {
    return this.post("/news_articles/search", params);
  }
}
