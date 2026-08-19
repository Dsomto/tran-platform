# SOC-A4 Portable Detection Replay

The signed Windows replay in `sealed-evidence/` is the controlling scored
source. Build the portable normalization, semantic detection, mutation, and
regression pipeline directly from that replay using Python 3.11 or newer.

The Wazuh, Windows, Sysmon, and Atomic files remain as compatibility material
for candidates who already began that route. They are optional; no VM, Docker,
cloud account, live endpoint, or internet connection is required for the scored
route, and stronger hardware earns no additional marks.

Existing Wazuh or Sigma rules may be retained when an adapter maps their inputs
and verdicts to the portable replay contract. `Capture-LabState.ps1` records
optional source telemetry and never fabricates a scored result.
