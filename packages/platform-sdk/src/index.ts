export type AnalyzeAndMatchRequest = {
  profile_id: string;
  source_language: string;
  target_language: string;
  text: string;
};

export class PlatformClient {
  constructor(private readonly baseUrl: string) {}

  async analyzeAndMatch(payload: AnalyzeAndMatchRequest) {
    const response = await fetch(this.baseUrl + "/api/v1/analyze-and-match", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("analyze-and-match failed: " + response.status);
    return response.json();
  }

  async providers() {
    const response = await fetch(this.baseUrl + "/api/v1/providers");
    if (!response.ok) throw new Error("provider catalog failed: " + response.status);
    return response.json();
  }
}
