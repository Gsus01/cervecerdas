import "dotenv/config";

import { hash } from "bcryptjs";
import postgres from "postgres";

function readArgument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

const username = readArgument("username");
const email = readArgument("email")?.toLowerCase();
const password = readArgument("password");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL es obligatoria");
}
if (!username || !/^[\p{L}\p{N}._-]{1,50}$/u.test(username)) {
  throw new Error("Indica --username con letras, números, puntos, guiones o guiones bajos");
}
if (!email || email.length > 254 || !email.includes("@")) {
  throw new Error("Indica un --email válido");
}
if (!password || password.length < 8 || password.length > 72) {
  throw new Error("Indica --password con entre 8 y 72 caracteres");
}

const client = postgres(databaseUrl, { max: 1 });

try {
  const passwordHash = await hash(password, 12);
  const [admin] = await client`
    insert into users (username, email, password_hash, role)
    values (${username}, ${email}, ${passwordHash}, 'ADMIN')
    on conflict (email) do update
      set role = 'ADMIN', password_hash = excluded.password_hash, updated_at = now()
    returning id, username, email, role
  `;

  console.info(`Administrador listo: ${admin.username} <${admin.email}>`);
} finally {
  await client.end();
}
