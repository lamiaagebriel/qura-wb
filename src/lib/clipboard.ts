/**
 * `navigator.clipboard` is only defined in a secure context (https, or
 * localhost) — plain http on a LAN IP (testing from a phone against a dev
 * server, for instance) doesn't have it. `execCommand` is deprecated but
 * still the only fallback that works without it.
 *
 * iOS Safari specifically needs more than `textarea.select()`: the
 * textarea has to be `readOnly` (otherwise iOS shows the system paste
 * menu instead of selecting) and the selection has to be set via
 * `setSelectionRange`, not `select()`, which iOS ignores on a
 * programmatically-inserted field. `fontSize: 16px` stops iOS from
 * auto-zooming the page in when the field gets focus.
 */
function copyViaExecCommand(value: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.fontSize = "16px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  let succeeded = false;
  try {
    succeeded = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
  return succeeded;
}

/** Resolves `true` on success, `false` if nothing actually got copied —
 * never throws, so callers can just branch on the return value. */
export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    return copyViaExecCommand(value);
  } catch {
    return false;
  }
}
