import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-keyboard-palette","title":"Keyboard Shortcut Palette","description":"Prepare a professional advisory report for keyboard shortcut palette using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapKeyboardPalette({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
