import { mkdir, writeFile, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
await mkdir(".local", { recursive: true });
for (const file of ["admin-password.txt", "session-secret.txt"]) {
  try {
    await access(".local/" + file);
  } catch {
    await writeFile(".local/" + file, randomBytes(32).toString("base64url"), {
      mode: 0o600,
    });
  }
}
console.log(
  "Local secrets are ready in .local/. Read .local/admin-password.txt to sign in. Never commit this directory.",
);
