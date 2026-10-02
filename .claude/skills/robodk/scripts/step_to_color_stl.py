"""STEP -> one binary STL per CAD color + colors.json, for importing colored CAD into
RoboDK (STL has no colors; set each file's color with item.setColor after AddFile).

Uses FreeCAD's GUI importer headless (the console importer drops colors): exports the
scene as VRML, then flattens it (DEF/USE instancing, Transforms, IndexedFaceSet with
material or per-face colors) and groups the triangles by color. Points/lines are dropped.
Coordinates stay in the STEP frame (mm); rotate to Z up in RoboDK if the STEP is Y up.

Usage: python step_to_color_stl.py in.step out_dir [--freecad freecad] [--lift 0.0]
  --lift L: brighten colors, c' = L + (1 - L) * c (dark CAD colors read black in RoboDK)
Writes out_dir/color_NN_rrggbb.stl and out_dir/colors.json [[file, [r, g, b, 1]], ...].
Needs: FreeCAD with GUI (`freecad` binary), numpy. Starting point, not the only way: a
glTF/OBJ route or a CAD kernel with color access (OCP/pythonocc) may serve better.
"""
import argparse
import gzip
import json
import os
import re
import subprocess
import tempfile

import numpy as np

EXPORT = r'''
import gzip, os, FreeCAD, FreeCADGui, ImportGui
log = open(os.environ["LOG"], "w")
try:
    doc = FreeCAD.newDocument("d")
    ImportGui.insert(os.environ["SRC"], doc.Name)
    roots = [o for o in doc.RootObjects if hasattr(o, "Shape") and o.Shape.Faces]
    FreeCADGui.export(roots, os.environ["DST"])
    data = open(os.environ["DST"], "rb").read()
    if data[:2] == b"\x1f\x8b":
        open(os.environ["DST"], "wb").write(gzip.decompress(data))
    log.write("ok\n")
except Exception as e:
    log.write("error %r\n" % e)
log.close()
os._exit(0)
'''


def exportVrml(step, wrl, freecad):
    """Colored VRML of a STEP through FreeCAD's GUI importer, offscreen."""
    with tempfile.TemporaryDirectory() as tmp:
        script, log = os.path.join(tmp, "export.py"), os.path.join(tmp, "log")
        open(script, "w").write(EXPORT)
        env = dict(os.environ, QT_QPA_PLATFORM="offscreen", SRC=os.path.abspath(step),
                   DST=os.path.abspath(wrl), LOG=log)
        subprocess.run([freecad, script], env=env, stdout=subprocess.DEVNULL,
                       stderr=subprocess.DEVNULL, timeout=3600)
        status = open(log).read() if os.path.exists(log) else "no log (FreeCAD failed)"
    if not status.startswith("ok"):
        raise SystemExit("FreeCAD export failed: " + status)


class Vrml:
    """Minimal VRML 2 reader: nodes as dicts, DEF/USE resolved, numeric lists as arrays."""

    def __init__(self, text):
        text = re.sub(r"#[^\n]*", "", text)
        self.tokens = re.findall(r"\[[^\[\]{}]*\]|[{}\[\]]|[^\s{}\[\],]+", text)
        self.pos = 0
        self.defs = {}

    def next(self):
        self.pos += 1
        return self.tokens[self.pos - 1]

    def nodes(self):
        while self.pos < len(self.tokens):
            yield self.node()

    def node(self):
        tok = self.next()
        if tok == "USE":
            return self.defs[self.next()]
        if tok == "DEF":
            name = self.next()
            self.defs[name] = self.node()
            return self.defs[name]
        node = {"type": tok}
        assert self.next() == "{"
        while self.tokens[self.pos] != "}":
            field, peek = self.next(), self.tokens[self.pos]
            if peek == "[":
                self.next()
                items = []
                while self.tokens[self.pos] != "]":
                    items.append(self.node())
                self.next()
                node[field] = items
            elif peek.startswith("["):
                body = self.next()[1:-1].replace(",", " ").split()
                node[field] = np.array(body, dtype=float) if field != "children" else []
            elif peek in ("DEF", "USE") or (peek[0].isupper() and peek not in ("TRUE", "FALSE")):
                node[field] = self.node()
            else:
                values = []
                while re.match(r"^[-+0-9.eE]+$|^TRUE$|^FALSE$", self.tokens[self.pos]):
                    values.append(self.next())
                node[field] = values
        self.next()
        return node


def transform(node):
    """4x4 matrix of a VRML Transform (center, rotation, scale, translation)."""
    get = lambda f, d: np.array(node.get(f, d), dtype=float)  # noqa: E731
    axis, angle = get("rotation", [0, 0, 1, 0])[:3], get("rotation", [0, 0, 1, 0])[3]
    axis = axis / (np.linalg.norm(axis) or 1)
    k = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    rot = np.eye(3) + np.sin(angle) * k + (1 - np.cos(angle)) * k @ k
    center = get("center", [0, 0, 0])
    mat = np.eye(4)
    mat[:3, :3] = rot * get("scale", [1, 1, 1])
    mat[:3, 3] = get("translation", [0, 0, 0]) + center - mat[:3, :3] @ center
    return mat


def faceSet(geom, appearance, mat):
    """(triangles Nx3x3, colors Nx3) of an IndexedFaceSet in world coordinates."""
    points = geom["coord"]["point"].reshape(-1, 3) @ mat[:3, :3].T + mat[:3, 3]
    index = geom["coordIndex"].astype(int)
    faces, faceOf = [], []
    for faceNo, poly in enumerate(np.split(index, np.where(index == -1)[0] + 1)):
        poly = poly[poly >= 0]
        for i in range(1, len(poly) - 1):                     # fan triangulation
            faces.append((poly[0], poly[i], poly[i + 1]))
            faceOf.append(faceNo)
    faces = np.array(faces, dtype=int).reshape(-1, 3)
    faceOf = np.array(faceOf, dtype=int)
    material = (appearance or {}).get("material", {})
    colors = np.tile(np.array(material.get("diffuseColor", [0.8, 0.8, 0.8]), float),
                     (len(faces), 1))
    if "color" in geom:
        palette = geom["color"]["color"].reshape(-1, 3)
        if geom.get("colorPerVertex", ["TRUE"])[0] == "FALSE":
            if "colorIndex" in geom:
                ci = geom["colorIndex"].astype(int)
                palette = palette[ci[ci >= 0]]
            colors = palette[np.minimum(faceOf, len(palette) - 1)]
        else:                                                  # first vertex's color
            colors = palette[np.minimum(faces[:, 0], len(palette) - 1)]
    return points[faces], colors


def flatten(nodes):
    triangles, colors = [], []

    def walk(node, mat):
        if node["type"] == "Transform":
            mat = mat @ transform(node)
        if node["type"] == "Shape":
            geom = node.get("geometry", {})
            if geom.get("type") == "IndexedFaceSet":
                t, c = faceSet(geom, node.get("appearance"), mat)
                triangles.append(t)
                colors.append(c)
            return
        children = node.get("children", [])
        for child in children if isinstance(children, list) else [children]:
            walk(child, mat)

    for node in nodes:
        walk(node, np.eye(4))
    return np.concatenate(triangles), np.concatenate(colors)


def writeStls(triangles, colors, outDir, lift):
    os.makedirs(outDir, exist_ok=True)
    colors = np.round(lift + (1 - lift) * colors, 2)
    unique, group = np.unique(colors, axis=0, return_inverse=True)
    listing = []
    for n, color in enumerate(unique):
        tris = triangles[group.ravel() == n].astype(np.float32)
        normals = np.cross(tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0])
        normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-12)
        rec = np.zeros(len(tris), dtype=[("n", "<3f4"), ("v", "<9f4"), ("a", "<u2")])
        rec["n"], rec["v"] = normals, tris.reshape(-1, 9)
        name = "color_%02d_%02x%02x%02x.stl" % ((n,) + tuple(int(c * 255) for c in color))
        with open(os.path.join(outDir, name), "wb") as f:
            f.write(b"binary stl".ljust(80) + np.uint32(len(tris)).tobytes() + rec.tobytes())
        listing.append([name, [float(c) for c in color] + [1.0]])
    json.dump(listing, open(os.path.join(outDir, "colors.json"), "w"), indent=1)
    return listing


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("step")
    ap.add_argument("out_dir")
    ap.add_argument("--freecad", default="freecad")
    ap.add_argument("--lift", type=float, default=0.0)
    args = ap.parse_args()
    with tempfile.TemporaryDirectory() as tmp:
        wrl = os.path.join(tmp, "scene.wrl")
        exportVrml(args.step, wrl, args.freecad)
        tris, cols = flatten(Vrml(open(wrl).read()).nodes())
    listing = writeStls(tris, cols, args.out_dir, args.lift)
    p = tris.reshape(-1, 3)
    print("%d triangles in %d colors, bbox %s .. %s" % (len(tris), len(listing),
                                                       p.min(0).round(), p.max(0).round()))
