import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-auto-pr-from-issue","title":"Auto-PR From Issue","description":"Prepare a professional advisory report for auto-pr from issue using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapAutoPrFromIssue({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
