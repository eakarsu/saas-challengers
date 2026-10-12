import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-plan-from-brief","title":"Generative Plan From One-Line Brief","description":"Prepare a professional advisory report for generative plan from one-line brief using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfPlanFromBrief({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
