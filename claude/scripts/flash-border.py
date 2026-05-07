#!/usr/bin/env python3
"""Animated marching-ants border around the screen.

Four thin Tk Toplevel windows hugging the screen edges. White
blocks march clockwise so it visually circles around the screen.
Stays alive until the process is killed (SIGTERM/SIGINT).
"""

import signal
import sys
import tkinter as tk

THICKNESS = 10        # strip thickness in px
STRIPE = 14           # white block length
GAP = 14              # gap between blocks
SPEED = 3             # px per frame
FPS = 30
ALPHA = 0.9
BG = "#0a0a0a"
COLORS = ("#ffffff", "#ff8a1e")  # alternating white / orange blocks

root = tk.Tk()
root.withdraw()
sw = root.winfo_screenwidth()
sh = root.winfo_screenheight()


def make_strip(x: int, y: int, w: int, h: int) -> tk.Canvas:
    win = tk.Toplevel(root)
    win.overrideredirect(True)
    win.attributes("-topmost", True)
    try:
        win.attributes("-alpha", ALPHA)
    except tk.TclError:
        pass
    win.geometry(f"{w}x{h}+{x}+{y}")
    win.configure(bg=BG)
    c = tk.Canvas(win, width=w, height=h, bg=BG,
                  highlightthickness=0, bd=0)
    c.pack(fill="both", expand=True)
    return c


# (canvas, width, height, axis 'x'|'y', direction +1|-1)
strips = [
    (make_strip(0, 0, sw, THICKNESS),                  sw, THICKNESS, 'x',  1),  # top    → right
    (make_strip(sw - THICKNESS, 0, THICKNESS, sh),     THICKNESS, sh, 'y',  1),  # right  → down
    (make_strip(0, sh - THICKNESS, sw, THICKNESS),     sw, THICKNESS, 'x', -1),  # bottom → left
    (make_strip(0, 0, THICKNESS, sh),                  THICKNESS, sh, 'y', -1),  # left   → up
]


def cleanup(*_):
    try:
        root.destroy()
    except Exception:
        pass
    sys.exit(0)


signal.signal(signal.SIGTERM, cleanup)
signal.signal(signal.SIGINT, cleanup)

period = STRIPE + GAP
offset = 0


def animate():
    global offset
    offset = (offset + SPEED) % period
    for c, w, h, axis, direction in strips:
        c.delete("all")
        shift = offset * direction
        if axis == 'x':
            cur = -period * 2 + shift
            i = 0
            while cur < w + period * 2:
                c.create_rectangle(cur, 0, cur + STRIPE, h,
                                   fill=COLORS[i % len(COLORS)], outline="")
                cur += period
                i += 1
        else:
            cur = -period * 2 + shift
            i = 0
            while cur < h + period * 2:
                c.create_rectangle(0, cur, w, cur + STRIPE,
                                   fill=COLORS[i % len(COLORS)], outline="")
                cur += period
                i += 1
    root.after(int(1000 / FPS), animate)


animate()
root.mainloop()
