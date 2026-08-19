# Stage 8 Portable Hardening Sandbox

The portable sandbox is the controlling scored host. It uses only Python's
standard library, writes under a candidate-owned directory, and never changes
the real computer.

1. Build an immutable baseline:

   `python3 portable_host.py build --out sandbox`

2. Record the expected failing baseline:

   `python3 portable_host.py check --root sandbox`

3. Build your own declarative control schema, plan compiler, apply engine,
   rollback engine, evidence collector, and test runner. All changes must remain
   below `sandbox/`.
4. A second apply must report zero changes. Service tests must remain green.
5. Roll back and prove the original hashes return:

   `python3 portable_host.py verify-rollback --root sandbox`

6. Reapply and run the final security and service checks unattended.

The legacy Vagrant and baseline scripts remain only as compatibility material
for candidates who already began the VM route. They are not mandatory and do
not earn additional marks.
