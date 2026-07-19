# SOC-A3 Containerlab/FRR Reference Source

This is the source bundle for the seven-zone routed range. It intentionally
keeps topology, routing, policy, telemetry, and fault overlays separate so a
candidate cannot pass by submitting a diagram.

`make lab` creates the topology. `make baseline` loads the FRR and nftables
configuration. `make collect` exports container state, routes, firewall rules,
and packet/flow evidence without declaring a result. Private room conditions
must be implemented from the authenticated room instructions and must never be
embedded in the shared base archive.
