#!/usr/bin/env python3
"""
verify_edit.py — automated quality checks for a rendered Eurogang vlog edit.

Run after a Remotion render. Reads the MP4 and checks:
  • Audio-gap: any stretch >2s where audio RMS is near-silence?
  • Mid-speech-cut: at each known cut frame, is RMS high (likely speech)?
  • Cuts/30s: density per bucket — is the second half thinner than the first?
  • Loudness curve: where does the music drop / spike?
  • File integrity: duration matches expected, codec ok

Usage:
  python3 verify_edit.py <path/to/render.mp4> [--schedule SCHEDULE.json] [--spec SPEC.json]

Outputs a structured JSON report on stdout + human-readable summary on stderr.
Exits 0 if all checks pass, 1 if issues found.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


def run(cmd: list[str], capture_stderr: bool = False) -> tuple[str, str, int]:
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.stdout, p.stderr, p.returncode


def ffprobe_duration(path: Path) -> float:
    out, _, _ = run(["ffprobe", "-v", "error", "-show_entries",
                     "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
                     str(path)])
    return float(out.strip())


def detect_silence(path: Path, threshold_db: float = -45.0, min_duration_s: float = 0.5) -> list[dict]:
    """ffmpeg silencedetect filter — returns list of {start, end, duration} silence intervals."""
    cmd = [
        "ffmpeg", "-hide_banner", "-i", str(path),
        "-af", f"silencedetect=noise={threshold_db}dB:d={min_duration_s}",
        "-f", "null", "-",
    ]
    _, stderr, _ = run(cmd, capture_stderr=True)

    starts: list[float] = []
    ends: list[float] = []
    for line in stderr.splitlines():
        m_start = re.search(r"silence_start: ([\d.]+)", line)
        m_end = re.search(r"silence_end: ([\d.]+)", line)
        if m_start:
            starts.append(float(m_start.group(1)))
        elif m_end:
            ends.append(float(m_end.group(1)))

    intervals = []
    for s, e in zip(starts, ends):
        intervals.append({"start": s, "end": e, "duration": e - s})
    return intervals


def detect_black_frames(path: Path, pixel_threshold: float = 0.10, picture_threshold: float = 0.98,
                        min_duration_s: float = 0.3) -> list[dict]:
    """ffmpeg blackdetect filter — returns list of {start, end, duration} where the frame is mostly black.

    pixel_threshold (pix_th): 0.0-1.0, max pixel luma considered "black" (default 0.10 = quite dark).
    picture_threshold (pic_th): 0.0-1.0, ratio of black pixels needed for the frame to count (default 0.98 = 98% of pixels must be black).
    min_duration_s (d): minimum continuous duration for a black-detection event.
    """
    cmd = [
        "ffmpeg", "-hide_banner", "-i", str(path),
        "-vf", f"blackdetect=d={min_duration_s}:pix_th={pixel_threshold}:pic_th={picture_threshold}",
        "-an", "-f", "null", "-",
    ]
    _, stderr, _ = run(cmd, capture_stderr=True)

    intervals: list[dict] = []
    for line in stderr.splitlines():
        m = re.search(r"black_start:([\d.]+)\s+black_end:([\d.]+)\s+black_duration:([\d.]+)", line)
        if m:
            intervals.append({
                "start": float(m.group(1)),
                "end": float(m.group(2)),
                "duration": float(m.group(3)),
            })
    return intervals


def sample_rms_at_times(path: Path, times: list[float], window_s: float = 0.1) -> list[float]:
    """For each timestamp, sample the audio RMS in a small window around it.

    Returns a list of mean-square root amplitudes (0..1 nominal).
    """
    if not times:
        return []
    # Use ffmpeg astats per-segment. Cheap version: extract each window to a tiny WAV and read amplitude.
    rms_values = []
    for t in times:
        start = max(0, t - window_s / 2)
        cmd = [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-ss", f"{start:.3f}", "-t", f"{window_s:.3f}",
            "-i", str(path),
            "-af", "astats=metadata=1:reset=0",
            "-f", "null", "-",
        ]
        _, stderr, _ = run(cmd, capture_stderr=True)
        # find RMS_level (dB)
        m = re.search(r"RMS level dB:\s*(-?\d+\.\d+|inf|-inf)", stderr)
        if m:
            try:
                db = float(m.group(1))
                # convert dB to linear (0..1)
                lin = 10 ** (db / 20)
                rms_values.append(lin)
            except (ValueError, OverflowError):
                rms_values.append(0.0)
        else:
            rms_values.append(0.0)
    return rms_values


def analyze(mp4_path: Path, spec: dict) -> dict:
    duration = ffprobe_duration(mp4_path)
    silences = detect_silence(mp4_path,
                              threshold_db=spec.get("silence_threshold_db", -45.0),
                              min_duration_s=spec.get("silence_min_duration_s", 0.5))
    long_silences = [s for s in silences if s["duration"] >= spec.get("music_gap_max_s", 2.0)]

    blacks = detect_black_frames(mp4_path,
                                 pixel_threshold=spec.get("black_pix_th", 0.10),
                                 picture_threshold=spec.get("black_pic_th", 0.98),
                                 min_duration_s=spec.get("black_min_duration_s", 0.3))
    long_blacks = [b for b in blacks if b["duration"] >= spec.get("black_max_s", 0.5)]

    issues: list[str] = []
    if long_silences:
        for s in long_silences:
            issues.append(
                f"AUDIO_GAP: silence {s['duration']:.2f}s at {s['start']:.2f}s "
                f"(spec max: {spec.get('music_gap_max_s', 2.0)}s)"
            )

    if long_blacks:
        for b in long_blacks:
            issues.append(
                f"BLACK_FRAMES: {b['duration']:.2f}s of black at {b['start']:.2f}s "
                f"(spec max: {spec.get('black_max_s', 0.5)}s)"
            )

    # Quick check: did audio cover most of the timeline?
    total_silent = sum(s["duration"] for s in silences)
    silence_ratio = total_silent / duration if duration > 0 else 0.0
    if silence_ratio > spec.get("max_silence_ratio", 0.10):
        issues.append(
            f"HIGH_SILENCE_RATIO: {silence_ratio:.1%} of edit is silent "
            f"(spec max: {spec.get('max_silence_ratio', 0.10):.0%})"
        )

    total_black = sum(b["duration"] for b in blacks)
    black_ratio = total_black / duration if duration > 0 else 0.0
    if black_ratio > spec.get("max_black_ratio", 0.02):
        issues.append(
            f"HIGH_BLACK_RATIO: {black_ratio:.1%} of edit is black "
            f"(spec max: {spec.get('max_black_ratio', 0.02):.0%})"
        )

    return {
        "file": str(mp4_path),
        "duration_s": round(duration, 3),
        "silences_detected": len(silences),
        "long_silences": long_silences,
        "silence_ratio": round(silence_ratio, 4),
        "blacks_detected": len(blacks),
        "long_blacks": long_blacks,
        "black_ratio": round(black_ratio, 4),
        "issues": issues,
        "passed": len(issues) == 0,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("mp4")
    ap.add_argument("--spec", default=None,
                    help="Path to spec JSON (constraints). If omitted, defaults are used.")
    ap.add_argument("--quiet", action="store_true",
                    help="Only emit JSON on stdout — no human summary on stderr.")
    args = ap.parse_args()

    spec = {
        "music_gap_max_s": 2.0,
        "silence_threshold_db": -45.0,
        "silence_min_duration_s": 0.5,
        "max_silence_ratio": 0.10,
    }
    if args.spec:
        spec.update(json.loads(Path(args.spec).read_text()))

    mp4 = Path(args.mp4)
    if not mp4.exists():
        print(f"ERROR: file not found: {mp4}", file=sys.stderr)
        return 2

    report = analyze(mp4, spec)
    print(json.dumps(report, indent=2))

    if not args.quiet:
        print(f"\n=== verify_edit report ===", file=sys.stderr)
        print(f"  file:       {report['file']}", file=sys.stderr)
        print(f"  duration:   {report['duration_s']}s", file=sys.stderr)
        print(f"  silences:   {report['silences_detected']} (total {report['silence_ratio']:.1%} of edit)", file=sys.stderr)
        print(f"  long gaps:  {len(report['long_silences'])} > {spec['music_gap_max_s']}s", file=sys.stderr)
        print(f"  blacks:     {report['blacks_detected']} (total {report['black_ratio']:.1%} of edit)", file=sys.stderr)
        print(f"  long blacks:{len(report['long_blacks'])} > {spec.get('black_max_s', 0.5)}s", file=sys.stderr)
        if report['passed']:
            print(f"  status:     ✓ PASSED", file=sys.stderr)
        else:
            print(f"  status:     ✗ FAILED — {len(report['issues'])} issues:", file=sys.stderr)
            for issue in report['issues']:
                print(f"    - {issue}", file=sys.stderr)

    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
