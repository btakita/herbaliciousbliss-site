CREATE TABLE IF NOT EXISTS person (
  id TEXT NOT NULL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  email_verified INTEGER,
  image TEXT,
  google_sub TEXT,
  google_picture TEXT
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT NOT NULL PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES person(id),
  expire_dts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS session_person_id_idx ON session(person_id);
