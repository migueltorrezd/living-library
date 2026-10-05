"""Minimal reader/writer for uncompressed glTF (.gltf + .bin) and binary .glb files."""
import json, struct, numpy as np
from pathlib import Path

COMP = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


class Gltf:
    def __init__(self, path):
        self.path = Path(path)
        if self.path.suffix == '.glb':
            raw = self.path.read_bytes()
            assert raw[:4] == b'glTF', 'not a GLB'
            jlen = struct.unpack_from('<I', raw, 12)[0]
            self.json = json.loads(raw[20:20 + jlen])
            off = 20 + jlen
            blen = struct.unpack_from('<I', raw, off)[0] if off < len(raw) else 0
            self.bin = bytearray(raw[off + 8:off + 8 + blen])
        else:
            self.json = json.loads(self.path.read_text())
            self.bin = bytearray((self.path.parent / self.json['buffers'][0]['uri']).read_bytes())

    def accessor(self, i):
        a = self.json['accessors'][i]
        v = self.json['bufferViews'][a['bufferView']]
        dt = COMP[a['componentType']]
        n = NCOMP[a['type']]
        off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = v.get('byteStride')
        item = np.dtype(dt).itemsize * n
        if stride and stride != item:
            raw = np.frombuffer(self.bin, np.uint8, count=stride * a['count'], offset=off).reshape(a['count'], stride)[:, :item]
            arr = raw.copy().view(dt).reshape(a['count'], n)
        else:
            arr = np.frombuffer(self.bin, dt, count=a['count'] * n, offset=off).reshape(a['count'], n).copy()
        if a.get('normalized'):
            arr = arr.astype(np.float32) / np.iinfo(dt).max
        return arr

    def mesh(self, name_prefix):
        return [m for m in self.json['meshes'] if m['name'].startswith(name_prefix)]

    def save(self):
        """Write back in the same container format, with the buffer length updated."""
        self.json['buffers'][0]['byteLength'] = len(self.bin)
        if self.path.suffix == '.glb':
            js = json.dumps(self.json, separators=(',', ':')).encode()
            js += b' ' * (-len(js) % 4)
            bn = bytes(self.bin) + b'\0' * (-len(self.bin) % 4)
            total = 12 + 8 + len(js) + 8 + len(bn)
            self.path.write_bytes(struct.pack('<4sII', b'glTF', 2, total) + struct.pack('<I4s', len(js), b'JSON') + js
                                  + struct.pack('<I4s', len(bn), b'BIN\0') + bn)
        else:
            (self.path.parent / self.json['buffers'][0]['uri']).write_bytes(bytes(self.bin))
            self.path.write_text(json.dumps(self.json, separators=(',', ':')))
