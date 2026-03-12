const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SSEOptions {
  onToken: (token: string) => void;
  onDone: (data: string) => void;
  onError: (error: string) => void;
}

export function createSSEStream(
  path: string,
  body: unknown,
  options: SSEOptions
): AbortController {
  const controller = new AbortController();
  const token = typeof window !== "undefined"
    ? localStorage.getItem("forge_token")
    : null;

  fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        options.onError(`Stream failed: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        options.onError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();

            if (data === "[DONE]") {
              options.onDone(data);
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "token") {
                options.onToken(parsed.content);
              } else if (parsed.type === "done") {
                options.onDone(data);
              } else if (parsed.type === "error") {
                options.onError(parsed.content);
              }
            } catch {
              options.onToken(data);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        options.onError(err.message);
      }
    });

  return controller;
}
