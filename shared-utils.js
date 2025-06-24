// Shared utilities for Claude API integration
class ClaudeAPIService {
  constructor() {
    this.apiKey = null;
    this.loadApiKey();
  }

  loadApiKey() {
    if (typeof extensionConfig !== 'undefined' &&
        extensionConfig.apiKey &&
        extensionConfig.apiKey !== 'YOUR_CLAUDE_API_KEY') {
      this.apiKey = extensionConfig.apiKey;
      return true;
    }
    return false;
  }

  createPrompt(content, url, phrase = null) {
    if (phrase) {
      // Explain highlighted text given context
      return `Please give a concise explanation of this text: ${phrase}.\n Use the following context of the webpage and surrounding information to make a relevant but brief explanation of the text I'm looking to understand.  URL: ${url}\n\nContext: ${content}\n\n`;
    } else {
      // Summarize the page
      return `Please provide a concise bullet-point summary of the main points from this webpage content. Focus only on the most important information. URL: ${url}\n\nContent: ${content}`;
    }
  }

  async getSummary(content, url, phrase = null, callbacks = {}) {
    const { onLoading, onSuccess, onError } = callbacks;

    try {
      // Call loading callback
      if (onLoading) onLoading();

      // Ensure API key is loaded
      if (!this.apiKey && !this.loadApiKey()) {
        throw new Error('API key not configured. Please set your actual API key in config.js');
      }

      const prompt = this.createPrompt(content, url, phrase);
      const model = (typeof extensionConfig !== 'undefined' && extensionConfig.apiModel) || "claude-3-sonnet-20240229";
      const maxTokens = (typeof extensionConfig !== 'undefined' && extensionConfig.apiMaxTokens) || (phrase ? 300 : 1000);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'anthropic-dangerous-direct-browser-access': 'true',
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();

      if (data.content && data.content[0] && data.content[0].text) {
        if (onSuccess) onSuccess(data.content[0].text);
      } else {
        throw new Error('Unexpected API response format');
      }

    } catch (error) {
      console.error('Claude API error:', error);
      if (onError) onError(error.message);
    }
  }
}

// Create a singleton instance
const claudeService = new ClaudeAPIService();