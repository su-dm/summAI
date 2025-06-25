(function() {
  class ClaudeAPIService {
    constructor() {
      // Hardcoded API key - replace with your actual key
      this.apiKey = 'API_KEY';
    }

    createPrompt(content, url, selectedText = null) {
      if (selectedText) {
        return `Please give a concise explanation of this text: "${selectedText}"

Use the following webpage context to provide a relevant explanation:
URL: ${url}
Context: ${content}

Keep the explanation brief and focused.`;
      }

      return `Please provide a concise bullet-point summary of the main points from this webpage:
URL: ${url}
Content: ${content}

Focus only on the most important information.`;
    }

    async getSummary(content, url, selectedText = null) {
      try {
        if (!this.apiKey || this.apiKey === 'YOUR_CLAUDE_API_KEY') {
          throw new Error('API key not configured. Please set your actual API key in the code.');
        }

        const prompt = this.createPrompt(content, url, selectedText);
        const maxTokens = selectedText ? self.SUMM_AI.CONFIG.MAX_TOKENS.EXPLANATION : self.SUMM_AI.CONFIG.MAX_TOKENS.SUMMARY;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'anthropic-dangerous-direct-browser-access': 'true',
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: self.SUMM_AI.CONFIG.API_MODEL,
            max_tokens: maxTokens,
            messages: [{ role: "user", content: prompt }]
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.content?.[0]?.text) {
          return data.content[0].text;
        }

        throw new Error('Unexpected API response format');
      } catch (error) {
        console.error('Claude API error:', error);
        throw error;
      }
    }
  }

  self.SUMM_AI.apiService = new ClaudeAPIService();
})();