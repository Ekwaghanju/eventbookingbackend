import { hashPassword, verifyPassword, verifyAgainstDummy } from '../lib/password.js';
import { httpError } from '../lib/http.js';
import db from '../lib/db.js';

const PUBLIC_COLUMNS = `
  id, email, name, org_name, org_type, phone, website,
  email_verified, verified, status, token_version,
  created_at, updated_at, last_login_at
`;

export async function findByEmail(email) {
  const { rows } = await db.query(
    `SELECT id, email, password_hash, name, org_name, org_type, phone, website,
            email_verified, verified, status, token_version
       FROM organizers
      WHERE email = LOWER($1)
      LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS}
       FROM organizers
      WHERE id = $1
      LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createOrganizer({
  email, password, name, orgName, orgType, phone, website,
}) {
  const passwordHash = await hashPassword(password);

  try {
    const { rows } = await db.query(
      `INSERT INTO organizers
         (email, password_hash, name, org_name, org_type, phone, website)
       VALUES (LOWER($1), $2, $3, $4, $5, $6, $7)
       RETURNING ${PUBLIC_COLUMNS}`,
      [email, passwordHash, name, orgName, orgType, phone, website ?? null]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      // unique_violation on email
      throw httpError(409, 'An account with that email already exists');
    }
    throw err;
  }
}

/**
 * Verifies credentials. Returns the public organizer row on success,
 * or null on any failure. Never leaks whether email exists or password is wrong.
 */
export async function verifyCredentials(email, password) {
  const row = await findByEmail(email);

  if (!row) {
    await verifyAgainstDummy(password); // constant-time-ish
    return null;
  }

  if (row.status !== 'active') {
    // Still run the compare to avoid timing signals
    await verifyPassword(password, row.password_hash);
    return null;
  }

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return null;

  // Update last_login_at best-effort
  await db.query(
    `UPDATE organizers SET last_login_at = NOW() WHERE id = $1`,
    [row.id]
  );

  // Return public shape only
  const { password_hash, ...safe } = row;
  return safe;
}

/**
 * Bump token_version to invalidate every JWT for this organizer.
 * Called after password changes and "sign out everywhere".
 */
export async function bumpTokenVersion(organizerId) {
  const { rows } = await db.query(
    `UPDATE organizers
        SET token_version = token_version + 1
      WHERE id = $1
      RETURNING token_version`,
    [organizerId]
  );
  return rows[0]?.token_version ?? null;
}