---
name: robodk
description: Build, simulate, validate and optimize RoboDK stations from Python (robolink API) - starting a scriptable RoboDK instance without blocking popups, importing STEP/STL CAD with colors, robots/tools/mechanisms (conveyors), IK and arm-configuration control, tracking programs synced to a conveyor, collision checks, off-screen screenshots and placement optimization. Use whenever a task involves RoboDK, .rdk stations, robolink scripts or robot cell simulation.
---

# Scripting RoboDK

Lessons from building and optimizing real cells. They are starting points and known
pitfalls, not the required method: verify against the installed version and prefer a
better approach when you find one.

## Find the installation first

- Typical locations: Linux `~/RoboDK`, Windows `C:/RoboDK`, macOS
  `/Applications/RoboDK.app`. The Python API ships in `<install>/Python` (`robodk`
  package); if `import robodk` fails, add that folder to `sys.path` (or `pip install
  robodk`, but the bundled one matches the installed RoboDK version).
- Version: `RDK.Version()`, or `strings <install>/bin/RoboDK | grep -m1 '^5\.'` on Linux.
  API names differ slightly between versions - grep `robolink.py` for a method before
  using it (`grep -n "    def SolveIK_All" <install>/Python/robodk/robolink.py`).
- The user may already run RoboDK (default API port 20500, possibly inside a container
  or VM). Do not script against their session: start a separate instance on another
  port and leave theirs alone.

## Start a scriptable instance (popups handled)

```
scripts/start_robodk.sh [port=20777] [station.rdk]   # private display :<port-20000>
scripts/start_robodk.sh --visible [port] [station]   # on the user's display, no watcher
scripts/start_robodk.sh --stop [port]                # RoboDK + watcher + display
```
Starts `RoboDK -NEWINSTANCE -PORT=<port> -NOSPLASH` (set `ROBODK_DIR` if not
`~/RoboDK`; the script sets the Linux library/Qt plugin paths) and waits for the port.
By default it runs on a **private Xvfb display** (Arch: xorg-server-xvfb; needs xdotool,
xprop), so nothing can touch the user's desktop, with a watcher that confirms RoboDK
dialogs (maintenance/license notices, "target not reachable", camera errors): **any open
dialog blocks every API call** until it is clicked, so unattended scripts hang without
it. The watcher only acts on windows of type `_NET_WM_WINDOW_TYPE_DIALOG` (menus,
toolbars and the main window are skipped), at most 3 times per window. Use `--visible`
only when the user wants to watch live - then dialogs are theirs to click. On
Windows/macOS, find an equivalent (or tell the user dialogs need clicking).

- Stop with `--stop <port>` (it kills RoboDK by its port argument and the display). Not
  `pkill -f "PORT=20777"`: it matches and kills your own shell too.
- An API call that times out usually means a dialog the watcher could not confirm:
  `DISPLAY=:<n> scrot -o shot.png` and read it, then click it (`DISPLAY=:<n> xdotool
  mousemove X Y click 1`).
- License limits show up as dialogs, e.g. a deactivated license / expired maintenance can
  refuse to `Save` a station with more than one robot (a mechanism counts) and hang the
  call. Build stations from a script so saving is optional and the build is reproducible.
- Never send keys or clicks to the user's display: window managers stack other windows
  on top, keys leak into whatever has focus (stray Enters, shortcuts firing) and
  screenshots capture their private windows.

## Connecting from Python

```python
import socket
from robodk.robolink import Robolink
RDK = Robolink(port=20777)
RDK.COM.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)  # huge speedup
RDK.COM.settimeout(300)   # collision checks against big meshes can be slow
```
- Without TCP_NODELAY every call can wait ~40 ms (Nagle + delayed ACK); IK-heavy searches
  go from hours to seconds with it.
- Always pass the port explicitly; a script that falls back to the default port talks to
  (or tries to launch) another RoboDK.
- Clear with `RDK.CloseStation()` in a loop, start with `RDK.AddStation(name)`,
  `RDK.Save(path)` at the end.
- Wrap builds in `RDK.Render(False)` ... `RDK.Render(True)`. Some derived poses (e.g. a
  mechanism's tool) only update once rendering is back on - re-read `PoseAbs()` after.

## CAD import

- STEP -> STL headless with FreeCAD: `freecadcmd -c "exec(open('script.py').read())"`
  (running `freecadcmd script.py` may swallow prints; progress output uses `\r`, filter
  with `tr '\r' '\n'`). Mesh with `MeshPart.meshFromShape(Shape=s, LinearDeflection=0.5,
  AngularDeflection=0.5)`; per assembly child: `Import.insert(file, doc)` then
  `zip(root.ElementList, root.Shape.childShapes())`. If FreeCAD crashes reading
  placements, get transforms by fitting meshes instead (numpy ICP).
- Many STEP exports are **Y up**; RoboDK is Z up. Check bounding boxes and apply
  `rotx(pi/2)` (or the object pose) as needed.
- **Colors**: STL carries none, and objects left on RoboDK's default color can render
  black. Always `item.setColor([r, g, b, 1])` after `AddFile`. To keep CAD colors:
  `python scripts/step_to_color_stl.py in.step out_dir [--lift 0.3]` writes one STL per
  CAD color plus `colors.json` (FreeCAD GUI run headless -> VRML -> flattened, grouped by
  color); load each file and `setColor` it, merging into one object if wanted. Older
  RoboDK versions may import VRML poorly or lack STEP import - check before relying on
  them; a newer RoboDK or another CAD route may make the converter unnecessary.
- Merge pieces into one object keeping their colors: `obj.AddGeometry(piece, eye())`,
  then `piece.Delete()`.
- Removing an object baked into a mesh: drop triangles fully inside a bounding box from
  the binary STL with numpy, write a copy, patch any hole left in a floor with a disc.
- Without scipy, nearest neighbours in numpy chunks are enough for an ICP of a few
  thousand points. Distance to a mesh's *vertices* is misleading on large flat faces.

## Robots, tools, mechanisms

- Robot files not installed locally: RoboDK's online library,
  `https://cdn.robodk.com/downloads-library/library-robots/<NAME>.robot`.
- `robot = RDK.AddFile(path.robot)` creates its own base frame: place it with
  `robot.Parent().setPose(...)`. (`AddFile(robot, myFrame)` can add an unexpected offset.)
- Tool: `tool = robot.AddTool(tcpPose, name)`; geometry `tool.AddGeometry(stlItem,
  poseStlToFlange)`. `tool.PoseAbs()` is the **flange**: TCP = `tool.PoseAbs() * tcpPose`.
  `RDK.AddShape(triangles, tool)` adds to the tool and returns (and lets you rename) it.
- Simple geometry: `RDK.AddShape([[x, y, z], ...])`, 3 points per triangle, outward CCW.
- 1-axis conveyor: `RDK.BuildMechanism(MAKE_ROBOT_1T, [baseObj, movingObj], [], [0], [0],
  [1], [lo], [hi], basePose, eye(), name)`. The axis is the base frame Z (`roty(pi/2)` for
  travel along X). Check where it put its base frame (`mech.Parent().Pose()`), reset it if
  needed, delete the source objects, `hook = mech.AddTool(eye(), "Hook")`,
  `part.setParentStatic(hook)`, and after `Render(True)` re-place the part:
  `part.setPose(part.Pose() * invH(part.PoseAbs()) * wantedAbs)`. Mechanism joint speed
  may be capped below what `setSpeed` asks for - measure it.

## Kinematics (API IK/FK is flange based)

- `robot.SolveIK(pose, seed, tool)`, `SolveIK_All(pose, tool)`, `SolveFK(j)` work on the
  flange relative to the robot base; pass the TCP explicitly. Verify once by setting the
  joints and comparing the tool's `PoseAbs() * tcp` with the target - conventions are
  easy to get wrong. `SolveIK_All(...).tr().rows` lists solutions (first 6 = joints).
- Arm configuration: `robot.JointPoses(j)` returns base + per-link frames (base frame):
  for a 6-axis arm shoulder `[2]`, elbow `[3]`, wrist 1 `[4]`, flange `[6]`. Build rules
  from them: elbow up (elbow above the shoulder-wrist line), reaching forward, upper-arm
  rise angle, wrist chain direction (`flange - wrist1`, e.g. within N deg of vertical).
  Filter `SolveIK_All` branches with the rule, seed each next point from the previous
  joints, and if the seeded solution breaks the rule fall back to the closest valid branch.
  Check against the user's reference pictures - and cover all joints, not only 1-3.
- The tool roll about its working axis is a free parameter that decides how the wrist
  sits; scan it (15-30 deg steps) per task. When ranking rolls, prefer the tool body's
  natural orientation (e.g. the tool axis that should point up, `pose.VX()[2]`) before
  singularity margin - otherwise the picked rolls look randomly tilted.
- Pose builders that derive the tool X/Y from a fixed reference axis ("X along world X",
  "X horizontal") degenerate when the tool's working axis is parallel to that reference:
  the roll becomes arbitrary. Detect that case and give an explicit roll.
- Enforce only the arm-configuration rules the user stated. Rules inferred from reference
  pictures or assumptions silently block solutions and push placements around: list
  every enforced rule to the user and get them confirmed before optimizing on them.
- Reach used by a pose: compute the elbow stretch from the elbow joint (law of cosines on
  the two arm link lengths, 1 = straight); the shoulder-to-wrist-point distance includes
  wrist offsets and overstates it. A reach reserve ("could still reach N mm further") has
  to be a hard requirement on every candidate - as a reported statistic the selection
  still picks stretched arms.
- Targets: `RDK.AddTarget(name, frame, robot)` + `setPoseAbs(pose)`. A Cartesian target
  used by **MoveJ** can be rejected as "not reachable" although IK solves -> give MoveJ
  joint targets (`setJoints(j)`, `setAsJointTarget()`). `setJoints` followed by
  `setAsCartesianTarget()` re-derives the pose from the joints and can shift it.
- Singularity margin (6-axis, e.g. UR): min of |sin j3|, |sin j5|, wrist-center radius
  from the base axis / ~600 mm, (1 - reach ratio) / 0.25.

## Programs and simulation

- `prog = RDK.AddProgram(name, robot)`; `setTool`, `setFrame`, `setSpeed(lin, joint)`,
  `MoveJ/MoveL(target)`, `setRounding(mm)` (-1 off), `Pause(ms)`, `setDO(name, value)`,
  `RunInstruction(other.Name(), INSTRUCTION_START_THREAD)` to run programs in parallel.
- Sync robots to a moving part by letting the **conveyor program start each robot
  thread** at a conveyor position (MoveJ to p, then START_THREAD); long time-based Pauses
  drift. Tracking: one MoveL per sample with `setSpeed(segment_length / segment_time)`,
  a `Pause` for ~0 mm segments, small rounding.
- MoveL fails near wrist singularities (wrist joint ~ 0) even when your solved joint path
  is continuous, and a MoveL between two arm configurations is invalid. Workaround: make
  every point a joint target and use MoveJ with joint speed = max joint step / segment
  time. This trades exact Cartesian (straight-line, constant-speed) motion for
  reachability - **always tell the user explicitly** when you replace linear moves by
  joint moves (or apply any other workaround that changes the motion: stopping a
  mechanism, relaxed tolerances, skipped points), which moves are affected and what it
  costs.
- A task that cannot be done while a mechanism moves (e.g. a conveyor) can pause it: the
  mechanism program moves to the stop position (rounding off), `Pause(ms)` for the robot
  program's duration (`prog.Update()[1]`), then continues. Tell the user - it changes
  cycle time and the other robots' timing.
- Wait for a running program with `prog.Busy()` in a poll loop.
- Validate with `prog.Update()` -> (valid instructions, time, distance, valid ratio,
  message); ratio < 1 means it stops at that instruction (`prog.Instruction(i)`).
- Run: `RDK.setSimulationSpeed(n)`, `prog.RunProgram()`; sample `Joints()` and tool
  `PoseAbs()` meanwhile to measure tracking error (heavy collision calls inside the
  sampling loop distort it).
- Collisions: `RDK.Collision(a, b)` per item pair (hide items to exclude them), or
  `setCollisionActive(COLLISION_ON)` + `Collisions()` / `CollisionItems()` for all pairs
  (includes harmless contacts like tool-flange, part-hook). A robot base resting exactly
  on a floor mesh can count as colliding: lift it a few mm or put it on a plate. Checks
  against huge meshes are slow - sample them sparingly.
- Per link: `RDK.Collision(robot.ObjectLink(i), item)` (6-axis: 2 upper arm, 3 forearm),
  for rules like "the arm must not touch X" while the tool may.

## Exporting

- `RDK.Save(path)` / `RDK.Save(path, station)` always writes an .rdk, whatever the
  extension. Objects save as STL/SLD/WRL only (no STEP); robot links and tools cannot be
  saved directly. Whole station as one mesh: `merged = RDK.AddShape(<one triangle>)`, then
  `merged.AddGeometry(item, invH(merged.PoseAbs()) * item.PoseAbs())` for every object,
  every `robot.ObjectLink(i)` (robots and mechanisms) and every tool, then
  `RDK.Save("x.stl", merged)` (`.wrl` keeps colors). STEP from millions of triangles is
  not practical.
- HTML/PDF 3D simulation: GUI only, File > Export Simulation (Ctrl+E), no API. The format
  defaults to **"Public Web link", which uploads** the simulation - switch to "html"
  before pressing anything. Pick "Existing program": use the program that runs the whole
  cycle (a main program that only starts threads ends immediately), Start, wait with
  `prog.Busy()`, Save, type the absolute path in the file dialog. RoboDK then opens the
  file in a browser (close it). It crashed when the panel was reused after switching
  stations: restart RoboDK per station.
- Drive the GUI on the private display of `scripts/start_robodk.sh` (never the user's
  desktop): `DISPLAY=:<n> xdotool search --name "RoboDK - "` + `windowsize <win> 1920
  1080`, then `DISPLAY=:<n> xdotool mousemove X Y click 1` / `DISPLAY=:<n> scrot -o
  file.png` to act and check each step.

## Screenshots (to check your own work)

Window captures fail when the RoboDK window is hidden or on another workspace. Render
off-screen with a simulated camera; create it once and move it:
```python
cf = RDK.AddFrame("snapcam")
cam = RDK.Cam2D_Add(cf, "FOCAL_LENGTH=6 FOV=55 FAR_LENGTH=40000 SIZE=1600x900")
cf.setPose(lookAt(eye_xyz, target_xyz))      # camera: Z forward, Y down, X right
RDK.Render(True); RDK.Cam2D_Snapshot("/absolute/path/out.png", cam)
RDK.Cam2D_Close(cam); cf.Delete()
```
Use absolute paths (relative ones resolve to RoboDK's working directory); re-creating the
camera per shot can give tiny images. `setVisible(False)` on the cell to see inside;
`RDK.setFlagsRoboDK(FLAG_ROBODK_ALL & ~FLAG_ROBODK_TREE_VISIBLE)` hides the tree for
window captures.

## Placement optimization pattern

- Keep layout, feature extraction (e.g. edge/corner lines from mesh cross-sections, saved
  as JSON), pose generation and path solving in one module shared by the build script
  and the optimizer, so both produce identical paths.
- Grid over base offset / distance / pedestal height; per job scan tool roll and aim
  variants (most accurate first); require the arm-configuration rule, smooth joints
  (e.g. <= 15 deg per sample), a singularity margin, then take the first collision-free
  candidate by margin.
- Evaluate the hardest jobs first and drop a base at its first failure; count which job
  blocks how many bases - that tells you what to relax (aim, angle, tool distance, wrist
  limit, approach poses, part hanging height) instead of guessing.
- Approach/park poses fail more often than the path itself (too far back along the tool
  axis, into the floor, out of reach, into fixtures): give them their own direction and
  distance per job.
- Run long searches in the background (`python -u search.py > log`) and read the log.
- Relative placement requirements ("same distance from X", "centered between Y") refer
  to the actual reference feature, not the station origin: read its real position from
  the station or geometry and parametrize placements relative to it.
- Measure cell geometry (free floor, walls, obstacles) before relying on it - a
  look-down camera render or mesh vertex queries beat estimates or notes from earlier.
