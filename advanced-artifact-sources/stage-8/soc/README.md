# SOC-A4 Wazuh/Windows Build Source

This bundle creates a pinned Wazuh Docker checkout and prepares an isolated
Windows endpoint. It stores custom rules and decoders as overlays so clean
deployment can be repeated without modifying a running manager manually.

The operator must provide a licensed/evaluation Windows 11 VM, a host-only
network, Sysmon binaries/configuration, and an Atomic Red Team checkout. Run
`prepare-wazuh.sh`, place the overlay in the generated single-node deployment,
then run `Install-Endpoint.ps1` inside the isolated Windows VM.

`Capture-LabState.ps1` records source telemetry and configuration. It does not
write a fabricated clean-run or mutation result.
