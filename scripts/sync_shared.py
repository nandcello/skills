"""Materialize shared references so skills can be installed independently."""
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = ('setup-verification', 'verify-changes')


def sync(root=ROOT, check=False):
    content = (root / 'shared/flow-contract.md').read_bytes()
    for name in TARGETS:
        target = root / 'skills' / name / 'references/flow-contract.md'
        if check:
            if not target.exists() or target.read_bytes() != content:
                raise ValueError(f'Stale shared reference: {target}; run python3 scripts/sync_shared.py')
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    sync(check=parser.parse_args().check)
