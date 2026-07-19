# SOC Advanced 3: Design the Network, Prove It Holds

## Window and scoring

Ten days. Final revision opportunity. 100 points: requirements and architecture
20, correct implementation 25, positive/negative testing 25, observability 15,
evidence and defense of tradeoffs 15.

## Build

Build the assigned network as code using containerlab, FRRouting, Linux
namespaces/containers, nftables, Zeek, and Suricata. The repository must define
user, finance, engineering, server, management, guest, DMZ, and sensor zones;
routing; stateful least-privilege policy; administrative paths; services; time;
and centralized telemetry. No manually configured node is permitted.

## Required testing

`make clean && make lab && make test` must build from zero and pass at least 30
published assertions. Test every intended allow, deny, stateful return path,
management path, sensor path, and required alert. The passive sensor may observe
all scored paths but must not initiate traffic into protected zones.

The assessor applies five holdout policy tests without allowing changes outside
the variant file. The candidate must also inject, diagnose, and repair these
three exact baseline faults in separate commits: remove established-return
handling on the finance path; broaden management ingress beyond its declared
source; and remove DMZ-to-server traffic from the sensor mirror. The private
D-set adds one fourth fault condition. Each fault must make a specific test
fail, produce packet/counter evidence, and return to green after repair. A broad
allow rule, manual node fix, or topology that cannot rebuild is a critical defect.

## Mission interface and handoff

- **You receive:** a private addressing/D-set overlay, buildable reference source, thirty public paths, five holdout policy assertions, and three explicit baseline fault contracts.
- **You build:** the seven-zone range, policy, mirrored telemetry, services, and evidence collection as code; telemetry must enter the Stage 5/6 schema through adapters.
- **You prove:** allowed, denied, return, management, spoofing, and sensor paths using packet and firewall/flow locators rather than screenshots.
- **You hand forward:** verified behaviors, fault evidence, benign boundary cases, PCAPs, and candidate detections for Stage 8.
