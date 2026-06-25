import OpenAI from 'openai';

const MODEL = 'gpt-4o-mini';

let openai = null;

function getClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key') {
      return null;
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export function isConfigured() {
  const apiKey = process.env.OPENAI_API_KEY;
  return !(!apiKey || apiKey === 'your_openai_api_key');
}

export async function chatCompletion({ systemPrompt, messages, maxTokens = 300, temperature = 0.7 }) {
  const client = getClient();
  if (!client) {
    return { ok: false, error: 'OPENAI_API_KEY not configured' };
  }

  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of (messages || [])) {
    formattedMessages.push({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.content
    });
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: formattedMessages,
      max_tokens: maxTokens,
      temperature,
    });

    const choice = response.choices?.[0];
    if (choice?.message?.content) {
      return { ok: true, text: choice.message.content.trim() };
    }

    return { ok: false, error: 'Empty response from OpenAI' };
  } catch (error) {
    const status = error.status;
    const message = error.error?.message || error.message;

    if (status === 429) {
      return { ok: false, error: 'Rate limit exceeded', status: 429 };
    }

    return { ok: false, error: message, status };
  }
}

export async function testConnection() {
  const client = getClient();
  if (!client) {
    return { connected: false, message: 'No OPENAI_API_KEY found in environment variables.' };
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'Reply with exactly: CONNECTED' }],
      max_tokens: 10,
      temperature: 0,
    });

    return {
      connected: true,
      message: 'OpenAI Connected Successfully',
      model: MODEL,
      response: response.choices?.[0]?.message?.content?.trim() || 'OK',
    };
  } catch (error) {
    const status = error.status;
    const message = error.error?.message || error.message;

    if (status === 429) {
      return {
        connected: false,
        message: 'API key is valid but rate limited.',
        error: message,
      };
    }

    if (status === 400 || status === 401 || status === 403) {
      return {
        connected: false,
        message: `API key rejected by OpenAI (HTTP ${status}).`,
        hint: 'Make sure the key is correct and was created at platform.openai.com/api-keys.',
        error: message,
      };
    }

    return {
      connected: false,
      message: `Unexpected response from OpenAI (HTTP ${status || 'unknown'}).`,
      error: message,
    };
  }
}
