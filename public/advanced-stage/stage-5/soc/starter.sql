-- SOC Advanced 1 starter. Add tables; do not place hunt answers here.
INSTALL json;
LOAD json;

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS norm;

-- Keep filename and source row so every normalized event remains traceable.
CREATE OR REPLACE TABLE raw.auth AS
SELECT *, filename AS source_file
FROM read_json_auto('source/auth.jsonl', filename = true, union_by_name = true);

CREATE OR REPLACE TABLE norm.auth AS
SELECT
  TRY_CAST(timestamp AS TIMESTAMPTZ) AS event_time_utc,
  lower(trim(CAST(username AS VARCHAR))) AS user_name,
  CAST(src_ip AS VARCHAR) AS src_ip,
  CAST(host AS VARCHAR) AS host,
  CAST(action AS VARCHAR) AS action,
  source_file
FROM raw.auth;

-- Required: add imports for web, DNS, firewall, and endpoint data; a parse
-- failure table; source reconciliation; and saved hunt views.
