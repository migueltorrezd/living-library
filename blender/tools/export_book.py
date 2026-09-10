"""Export one editable book to a new GLB, without saving or changing its source.

blender --background --factory-startup --python blender/tools/export_book.py -- \
    --input blender/books/naval.blend --slug naval --output .tmp/naval.glb
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import bpy

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--input', required=True, type=Path)
parser.add_argument('--slug', required=True)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
if args.output.exists():
    raise SystemExit('Output exists. Choose a new staging filename.')
bpy.ops.wm.open_mainfile(filepath=str(args.input.resolve()), load_ui=False)
roots = [o for o in bpy.context.scene.objects if o.get('slug') == args.slug]
if len(roots) != 1:
    raise SystemExit('The active scene must contain exactly one matching slug root.')
root = roots[0]
root.location = (0, 0, 0)
root.rotation_euler = (0, 0, 0)
bpy.ops.object.select_all(action='DESELECT')
selected = []
for obj in [root] + list(root.children_recursive):
    if obj.get('superseded') or obj.get('collision_proxy'):
        continue
    obj.hide_set(False)
    obj.hide_viewport = False
    obj.hide_render = False
    obj.select_set(True)
    selected.append(obj)
bpy.context.view_layer.objects.active = root
args.output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(args.output.resolve()), export_format='GLB', use_selection=True,
    use_active_scene=True, export_apply=True, export_yup=True, export_extras=True,
)
print(json.dumps({'slug': args.slug, 'objects': len(selected),
    'bytes': args.output.stat().st_size,
    'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest()}))
