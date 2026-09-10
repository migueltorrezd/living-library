"""Read-only Blender source inspection. Run with --background --factory-startup.

Pass a .blend path after --. The report checks portability, hierarchy and bounds;
it does not establish visual quality or absence of collisions during motion.
"""
import bpy
import json
import re
import sys
from pathlib import Path
from mathutils import Vector

path = Path(sys.argv[sys.argv.index('--') + 1])
bpy.ops.wm.open_mainfile(filepath=str(path.resolve()), load_ui=False)
roots = [o for o in bpy.context.scene.objects if o.get('slug')]
assert len(roots) == 1, 'Expected one book per editable source'
root = roots[0]
bpy.context.view_layer.update()
parts = [o for o in root.children_recursive if o.type == 'MESH' and not o.get('superseded') and not o.get('collision_proxy')]
case = [o for o in parts if o.name.startswith(('Back board', 'Wrapped printed cover', 'Printed case', 'Rounded cloth spine'))]
assert len(case) >= 3, 'Missing case parts'
corners = [o.matrix_world @ Vector(v) for o in case for v in o.bound_box]
bounds = [(max(v[k] for v in corners) - min(v[k] for v in corners)) * 1000 for k in (0, 2, 1)]
unpacked = [im.name for im in bpy.data.images if im.source == 'FILE' and not im.packed_file]
assert not unpacked, f'Unpacked images: {unpacked}'
private = []
for collection in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.node_groups):
    for block in collection:
        values = list(block.items())
        if isinstance(block, bpy.types.Image):
            values.append(('filepath', block.filepath))
        for key, value in values:
            if isinstance(value, str) and re.search(r'/Users/|/home/|[A-Z]:\\|Workspace', value):
                private.append(block.name + ':' + key)
assert not private, f'Workstation references: {private}'
assert not bpy.data.texts, 'Unexpected embedded scripts'
print('BOOK_INSPECTION ' + json.dumps({'slug': root['slug'],
    'meshes': len(parts), 'caseDimensionsMm': bounds,
    'images': len(bpy.data.images), 'packedImages': len(bpy.data.images),
    'rootScale': list(root.scale), 'scenes': len(bpy.data.scenes),
    'portable': True}))
