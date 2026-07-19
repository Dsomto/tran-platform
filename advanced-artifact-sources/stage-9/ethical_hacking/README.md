# EH-A5 Synthetic Estate Source

The estate exposes one front-door service on the host. The records and admin
services remain on an internal Docker network. In vulnerable mode the front
door performs unrestricted server-side fetches, the admin service discloses a
short-lived synthetic service token to internal callers, and the records
service accepts that token in a query parameter. The patched estate enforces a
fixed destination, header-only tokens, and an explicit record allowlist.

Copy `runtime.env.example` to `runtime.env`, replace every placeholder with
synthetic values, and inject `CROWN_JEWEL_ID`, `CROWN_JEWEL_FLAG`,
`ESTATE_TOKEN`, and `EVIDENCE_MARKER` through that local file. Never commit it,
use real customer data, or bind the internal services to host ports.
