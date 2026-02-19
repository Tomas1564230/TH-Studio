export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}
