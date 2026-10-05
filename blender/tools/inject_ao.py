"""Write baked per-vertex AO into public/models/<slug>.gltf (or a <slug>.glb) as a custom `_OCCLUSION`
attribute (float scalar, one per glTF vertex). Meshes are matched to the bake by
vertex positions (Blender renames meshes on import), with the importer's
Y-up -> Z-up conversion undone. Idempotent: an existing _OCCLUSION is replaced.
Usage: inject_ao.py <models_dir> <ao_dir> <slug> [<slug> ...]   (uses <slug>.glb when no <slug>.gltf exists)
"""
import sys, json, numpy as np
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from gltf_io import Gltf


def model_path(models, slug):
    gltf = models / f'{slug}.gltf'
    return gltf if gltf.exists() else models / f'{slug}.glb'


def inject(models, aodir, slug):
    g = Gltf(model_path(models, slug))
    bake = np.load(aodir / f'{slug}-ao.npz')
    names = sorted({k.split('|')[0] for k in bake.files})
    j = g.json
    report = {}
    for name in names:
        co = bake[name + '|co'].astype(np.float64)
        ao = np.clip(bake[name + '|ao'], 0, 1).astype(np.float32)
        gl = np.stack([co[:, 0], co[:, 2], -co[:, 1]], 1)  # Blender Z-up -> glTF Y-up
        match = None
        for mi, m in enumerate(j['meshes']):
            pos = [g.accessor(p['attributes']['POSITION']) for p in m['primitives']]
            n = sum(len(p) for p in pos)
            if n != len(gl):
                continue
            err = np.abs(np.concatenate(pos) - gl).max()
            if err < 1e-5:
                match = (mi, pos)
                break
        if match is None:
            raise RuntimeError(f'{slug}: no glTF mesh matches baked {name}')
        mi, pos = match
        start = 0
        for p, part in zip(j['meshes'][mi]['primitives'], pos):
            values = ao[start:start + len(part)]
            start += len(part)
            while len(g.bin) % 4:
                g.bin.append(0)
            off = len(g.bin)
            g.bin.extend(values.tobytes())
            j['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': values.nbytes, 'target': 34962})
            j['accessors'].append({'bufferView': len(j['bufferViews']) - 1, 'componentType': 5126, 'count': len(values),
                                   'type': 'SCALAR', 'min': [float(values.min())], 'max': [float(values.max())]})
            p['attributes']['_OCCLUSION'] = len(j['accessors']) - 1
        mesh = j['meshes'][mi]
        mesh.setdefault('extras', {})['occlusion'] = 'Closed-book Cycles ambient occlusion per vertex (6 mm reach), baked by blender/tools/ao_bake.py'
        report[mesh['name']] = round(float(ao.mean()), 3)
    # drop orphaned views from a previous injection is unnecessary: buffer is rewritten compactly below
    _compact(g)
    g.save()
    return report


def _compact(g):
    """Remove accessors/bufferViews no longer referenced (a replaced _OCCLUSION) and repack the buffer."""
    j = g.json
    used_acc = set()
    for m in j['meshes']:
        for p in m['primitives']:
            used_acc |= set(p['attributes'].values())
            if 'indices' in p:
                used_acc.add(p['indices'])
            for t in p.get('targets', []):
                used_acc |= set(t.values())
    for s in j.get('skins', []):
        if 'inverseBindMatrices' in s:
            used_acc.add(s['inverseBindMatrices'])
    for a in j.get('animations', []):
        for smp in a['samplers']:
            used_acc |= {smp['input'], smp['output']}
    acc_map = {old: new for new, old in enumerate(sorted(used_acc))}
    accessors = [j['accessors'][i] for i in sorted(used_acc)]
    used_view = sorted({a['bufferView'] for a in accessors if 'bufferView' in a} |
                       {im['bufferView'] for im in j.get('images', []) if 'bufferView' in im})
    view_map = {old: new for new, old in enumerate(used_view)}
    new_bin = bytearray()
    views = []
    for old in used_view:
        v = dict(j['bufferViews'][old])
        a = v.get('byteOffset', 0)
        data = g.bin[a:a + v['byteLength']]
        while len(new_bin) % 4:
            new_bin.append(0)
        v['byteOffset'] = len(new_bin)
        new_bin.extend(data)
        views.append(v)
    for a in accessors:
        if 'bufferView' in a:
            a['bufferView'] = view_map[a['bufferView']]
    for im in j.get('images', []):
        if 'bufferView' in im:
            im['bufferView'] = view_map[im['bufferView']]
    def remap(o):
        for m in j['meshes']:
            for p in m['primitives']:
                p['attributes'] = {k: acc_map[v] for k, v in p['attributes'].items()}
                if 'indices' in p:
                    p['indices'] = acc_map[p['indices']]
                p['targets'] = [{k: acc_map[v] for k, v in t.items()} for t in p.get('targets', [])] or p.pop('targets', None) or []
                if not p['targets']:
                    p.pop('targets')
    remap(None)
    for s in j.get('skins', []):
        if 'inverseBindMatrices' in s:
            s['inverseBindMatrices'] = acc_map[s['inverseBindMatrices']]
    for an in j.get('animations', []):
        for smp in an['samplers']:
            smp['input'] = acc_map[smp['input']]; smp['output'] = acc_map[smp['output']]
    j['accessors'] = accessors
    j['bufferViews'] = views
    g.bin = new_bin


if __name__ == '__main__':
    models, aodir = Path(sys.argv[1]), Path(sys.argv[2])
    for slug in sys.argv[3:]:
        g = Gltf(model_path(models, slug))
        # replace an earlier injection instead of stacking a second attribute
        for m in g.json['meshes']:
            for p in m['primitives']:
                p['attributes'].pop('_OCCLUSION', None)
        _compact(g)
        g.save()
        print(slug, inject(models, aodir, slug))
