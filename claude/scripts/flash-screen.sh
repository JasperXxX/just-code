#!/bin/bash
# Brief white screen flash on macOS via JXA + Cocoa.
# Borderless, semi-transparent, ignores mouse, joins all spaces incl. fullscreen.
# osascript runs as LSUIElement -> no Dock activation, no focus steal.
# Spawned in background so the calling hook returns immediately.

(osascript -l JavaScript <<'JXA' >/dev/null 2>&1
ObjC.import('AppKit');
var frame = $.NSScreen.mainScreen.frame;
var win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(frame, 0, 2, false);
win.setOpaque(false);
win.setBackgroundColor($.NSColor.whiteColor.colorWithAlphaComponent(0.55));
win.setLevel(1000);
win.setIgnoresMouseEvents(true);
win.setHasShadow(false);
// CanJoinAllSpaces | Stationary | FullScreenAuxiliary
win.setCollectionBehavior(1 | 2 | 256);
win.orderFrontRegardless();
delay(0.12);
win.orderOut($());
JXA
) &

disown 2>/dev/null || true
exit 0
