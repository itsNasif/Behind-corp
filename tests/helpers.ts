import { readFileSync } from "node:fs";
import { parse } from "dotenv";
export const localEnv = parse(readFileSync(".env.local"));
export async function operatorToken() {
  if (localEnv.APP_ENV !== "local")
    throw new Error("Tests require isolated local infrastructure");
  const r = await fetch(
    "http://localhost:8080/realms/master/protocol/openid-connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "admin-cli",
        username: localEnv.KC_BOOTSTRAP_ADMIN_USERNAME,
        password: localEnv.KC_BOOTSTRAP_ADMIN_PASSWORD,
      }),
    },
  );
  if (!r.ok) throw new Error("Local test operator unavailable");
  const { access_token } = await r.json();
  return access_token as string;
}
export async function operator() {
  const access_token = await operatorToken();
  return async (path: string, method = "GET", body?: unknown) => {
    const response = await fetch(
      `http://localhost:8080/admin/realms/behind/${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    if (!response.ok)
      throw new Error(`Local operator ${method} ${path}: ${response.status}`);
    return response.status === 204 ? null : response.json();
  };
}
export async function latestMail(email: string, subject?: string) {
  for (let n = 0; n < 30; n++) {
    const list = await (
      await fetch("http://localhost:8025/api/v1/messages")
    ).json();
    const message = list.messages.find(
      (m: { To: { Address: string }[]; Subject: string }) =>
        m.To.some((x) => x.Address === email) &&
        (!subject || m.Subject.toLowerCase().includes(subject.toLowerCase())),
    );
    if (message)
      return (
        await fetch(`http://localhost:8025/api/v1/message/${message.ID}`)
      ).json();
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Mailpit message not received");
}
