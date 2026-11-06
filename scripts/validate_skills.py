"""Check distributable skills and explicit-only policy for both supported hosts."""
from pathlib import Path
import re
import yaml
from sync_shared import sync

root = Path(__file__).resolve().parents[1]
folders = sorted(p.parent for p in (root / 'skills').glob('*/SKILL.md'))
assert folders, 'No skills found'
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
    for document in folder.rglob('*.md'):
        for relative in re.findall(r'\]\(([^)]+)\)', document.read_text()):
            if '://' not in relative and not relative.startswith('#'):
                target = (document.parent / relative.split('#', 1)[0]).resolve()
                assert target.is_relative_to(folder.resolve()), f'Reference escapes skill package: {relative}'
                assert target.is_file(), f'Broken reference in {document}: {relative}'
    print(f'Valid skill: {folder.name}')
sync(check=True)
print('Explicit-only policies and shared flow contract validated')
