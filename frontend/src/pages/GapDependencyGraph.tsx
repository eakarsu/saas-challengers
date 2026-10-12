import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-dependency-graph","title":"Dependency Graph Builder","description":"Prepare a professional advisory report for dependency graph builder using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapDependencyGraph({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
