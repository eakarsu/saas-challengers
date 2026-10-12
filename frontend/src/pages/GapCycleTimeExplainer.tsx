import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-cycle-time-explainer","title":"Cycle Time Explainer","description":"Prepare a professional advisory report for cycle time explainer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapCycleTimeExplainer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
