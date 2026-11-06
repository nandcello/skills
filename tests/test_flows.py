import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / 'skills/setup-verification'
spec = importlib.util.spec_from_file_location('flows', SKILL / 'scripts/validate_flows.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FlowTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((SKILL / 'assets/app-flows.example.json').read_text())
        self.ids = [t['id'] for t in self.data['tests']]

    def test_valid_full_inventory(self):
        result = module.validate(self.data, self.ids, require_all=True)
        self.assertEqual(result['unmappedTests'], [])

    def test_unmapped_new_test_fails_but_legacy_is_reported(self):
        inventory = self.ids + ['e2e/other.spec.ts::missing']
        self.assertEqual(module.validate(self.data, inventory)['unmappedTests'], inventory[-1:])
        with self.assertRaisesRegex(ValueError, 'Unmapped required'):
            module.validate(self.data, inventory, inventory[-1:])

    def test_disconnected_path_fails(self):
        self.data['edges'][1]['from'] = 'tasks.invalid'
        with self.assertRaisesRegex(ValueError, 'disconnected'):
            module.validate(self.data)

    def test_step_cannot_claim_whole_path(self):
        self.data['tests'][0]['edges'] = ['tasks.save']
        with self.assertRaisesRegex(ValueError, 'whole-path'):
            module.validate(self.data)

    def test_stale_test_fails(self):
        with self.assertRaisesRegex(ValueError, 'Stale test'):
            module.validate(self.data, self.ids[:1])

    def test_wrong_order_fails(self):
        self.data['tests'][0]['edges'].reverse()
        with self.assertRaisesRegex(ValueError, 'journey order'):
            module.validate(self.data)

    def test_empty_inventory_and_unknown_required_fail(self):
        with self.assertRaisesRegex(ValueError, 'zero tests'):
            module.validate(self.data, [])
        with self.assertRaisesRegex(ValueError, 'not discovered'):
            module.validate(self.data, self.ids, ['fictional'])

    def test_unknown_edges_and_duplicate_ids_fail(self):
        for mutate in [lambda d: d['journeys'][0]['edges'].append('unknown'),
                       lambda d: d['nodes'].append(copy.deepcopy(d['nodes'][0]))]:
            data = copy.deepcopy(self.data)
            mutate(data)
            with self.assertRaises(ValueError):
                module.validate(data)

    def test_boundary_requires_boundary_edge(self):
        self.data['tests'][0]['coverage'] = 'boundary'
        with self.assertRaisesRegex(ValueError, 'no boundary'):
            module.validate(self.data)

    def test_loop_preserves_order(self):
        self.data['edges'].append(dict(id='tasks.return', **{'from':'tasks.saved', 'to':'tasks.list'}, action='Return', role='member', outcome='List', evidence='Example', kind='normal', observed=False))
        self.data['journeys'][0]['edges'] += ['tasks.return', 'tasks.open', 'tasks.save']
        self.data['tests'][0]['edges'] = list(self.data['journeys'][0]['edges'])
        module.validate(self.data, self.ids, require_all=True)


if __name__ == '__main__':
    unittest.main()
