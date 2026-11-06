"""Check distributable skills and explicit-only policy for both supported hosts."""
from pathlib import Path
import re
import yaml

root = Path(__file__).resolve().parents[1]
folders = sorted((root / 'skills').iterdir())
assert {p.name for p in folders} == {'setup-verification', 'verify-changes'}
for folder in folders:
    text = (folder / 'SKILL.md').read_text()
    assert text.startswith('---\n')
    front, body = text[4:].split('\n---\n', 1)
    metadata = yaml.safe_load(front)
    assert metadata['name'] == folder.name
    assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', folder.name)
    assert 0 < len(metadata['description']) <= 1024
    assert metadata['disable-model-invocation'] is True
    assert metadata['user-invocable'] is True
    settings = yaml.safe_load((folder / 'agents/openai.yaml').read_text())
    assert settings['policy']['allow_implicit_invocation'] is False
    assert '$' + folder.name in settings['interface']['default_prompt']
    for relative in re.findall(r'\]\(([^)]+)\)', body):
        if '://' not in relative:
            assert (folder / relative).is_file(), f'Broken reference: {relative}'
    print(f'Valid skill: {folder.name}')
assert ((folders[0] / 'references/flow-contract.md').read_bytes() ==
        (folders[1] / 'references/flow-contract.md').read_bytes())
print('Explicit-only policies and shared flow contract validated')
