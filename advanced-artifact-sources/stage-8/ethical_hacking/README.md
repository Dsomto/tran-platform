# EH-A4 GOAD-Light Variant Overlay

Apply this overlay only to a clean GOAD-Light deployment on an isolated
host-only network. It does not redistribute GOAD images. Candidate-specific
names, flags, and passwords are supplied through a private JSON file generated
by `generate_variant.py` and are never committed to this directory.

The overlay creates two independently discoverable directory paths and places
the corresponding synthetic flags in ACL-restricted files. After application,
the operator captures provider checkpoints and hashes the provider metadata.
Reset by reverting the checkpoints, not by manually deleting visible clues.
