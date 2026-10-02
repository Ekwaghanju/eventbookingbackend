import bcrypt from 'bcrypt';
import config from './config.js';

const ROUNDS = config.bcrypt.rounds;

// Pre-computed hash used when an email isn't found, so the response
// time doesn't leak whether the account exists.
let DUMMY_HASH = null;

async function getDummyHash() {
  if (!DUMMY_HASH) {
    DUMMY_HASH = await bcrypt.hash('__never_matches__', ROUNDS);
  }
  return DUMMY_HASH;
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function verifyAgainstDummy(plain) {
  const dummy = await getDummyHash();
  await bcrypt.compare(plain, dummy);
  return false;
}