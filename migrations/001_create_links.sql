CREATE TABLE IF NOT EXISTS links (
  code varchar(8) PRIMARY KEY,
  url text NOT NULL,
  title text,
  clicks integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_clicked_at timestamptz,
  deleted boolean DEFAULT false NOT NULL
);
