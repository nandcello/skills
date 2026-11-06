#!/usr/bin/env python3
"""Validate app-flow structure and associations to runner-discovered test IDs."""
import argparse
import json
from pathlib import Path
import sys


def require(condition, message):
    if not condition:
        raise ValueError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def index(rows, label, fields):
    require(isinstance(rows, list), f'{label} must be an array')
    result = {}
    for row in rows:
        require(isinstance(row, dict), f'{label} entries must be objects')
        for field in ['id', *fields]:
            require(nonempty(row.get(field)), f'{label}: missing nonempty {field}')
        require(row['id'] not in result, f'{label}: duplicate ID {row["id"]}')
        result[row['id']] = row
    return result


def sequence(value, label):
    require(isinstance(value, list) and value and all(nonempty(x) for x in value),
            f'{label} must be a nonempty array of IDs')
    return value


def id_set(value, label):
    require(isinstance(value, list) and all(nonempty(x) for x in value),
            f'{label} must be an array of test IDs')
    require(len(value) == len(set(value)), f'{label} contains duplicate IDs')
    return set(value)


def validate(data, inventory=None, required=None, require_all=False):
    require(isinstance(data, dict) and data.get('version') == 1, 'Expected version 1 object')
    require(nonempty(data.get('revision')), 'Missing revision')
    require(nonempty(data.get('inventory')), 'Missing inventory scope and omissions')
    nodes = index(data.get('nodes'), 'nodes', ['label', 'evidence'])
    edges = index(data.get('edges'), 'edges', ['from', 'to', 'action', 'role', 'outcome', 'evidence'])
    journeys = index(data.get('journeys'), 'journeys', ['label'])
    tests = index(data.get('tests'), 'tests', ['journey', 'coverage'])
    require(nodes and edges and journeys, 'Map must contain nodes, edges and journeys')
    for edge in edges.values():
        require(edge['from'] in nodes and edge['to'] in nodes, f'Edge {edge["id"]}: unknown node')
        require(edge.get('kind') in ['normal', 'boundary', 'failure'], f'Edge {edge["id"]}: invalid kind')
        require(type(edge.get('observed')) is bool, f'Edge {edge["id"]}: observed must be boolean')
    used_edges = set()
    for journey in journeys.values():
        path = sequence(journey.get('edges'), f'Journey {journey["id"]} edges')
        previous = None
        for eid in path:
            require(eid in edges, f'Journey {journey["id"]}: unknown edge {eid}')
            edge = edges[eid]
            require(previous is None or previous == edge['from'], f'Journey {journey["id"]}: disconnected path at {eid}')
            previous = edge['to']
            used_edges.add(eid)
    require(set(edges) == used_edges, 'Every edge must belong to a journey')
    used_nodes = {e[k] for e in edges.values() for k in ['from', 'to']}
    require(set(nodes) == used_nodes, 'Every node must belong to a path')
    for test in tests.values():
        tid = test['id']
        require(test['journey'] in journeys, f'Test {tid}: unknown journey')
        selected = sequence(test.get('edges'), f'Test {tid} edges')
        path = journeys[test['journey']]['edges']
        cursor = iter(path)
        require(all(any(e == item for item in cursor) for e in selected), f'Test {tid}: edges not in journey order')
        coverage = test['coverage']
        require(coverage in ['step', 'boundary', 'whole-path'], f'Test {tid}: invalid coverage')
        if coverage == 'whole-path':
            require(selected == path, f'Test {tid}: whole-path must cover the entire journey')
        if coverage == 'boundary':
            require(any(edges[e]['kind'] != 'normal' for e in selected), f'Test {tid}: no boundary/failure edge')
    require(inventory is not None or (required is None and not require_all), 'Coverage gate requires inventory')
    unmapped = []
    if inventory is not None:
        discovered = id_set(inventory, 'inventory')
        require(discovered, 'Runner discovered zero tests')
        require(set(tests) <= discovered, f'Stale test IDs: {sorted(set(tests) - discovered)}')
        needed = id_set(required, 'required tests') if required is not None else set()
        require(needed <= discovered, f'Required test IDs not discovered: {sorted(needed - discovered)}')
        if require_all:
            needed = discovered
        require(needed <= set(tests), f'Unmapped required tests: {sorted(needed - set(tests))}')
        unmapped = sorted(discovered - set(tests))
    return {'journeys': len(journeys), 'mappedTests': len(tests), 'unmappedTests': unmapped,
            'mode': 'structure-only' if inventory is None else 'inventory-checked'}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('map', type=Path)
    p.add_argument('--inventory', type=Path)
    p.add_argument('--required-tests', type=Path)
    p.add_argument('--require-all', action='store_true')
    args = p.parse_args()
    try:
        read = lambda path: json.loads(path.read_text()) if path else None
        result = validate(read(args.map), read(args.inventory), read(args.required_tests), args.require_all)
        print(json.dumps(result, indent=2))
    except (ValueError, OSError, TypeError, KeyError) as error:
        print(f'Flow validation failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
