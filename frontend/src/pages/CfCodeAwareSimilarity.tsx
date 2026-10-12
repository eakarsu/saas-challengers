import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-code-aware-similarity","title":"Code-Aware Similarity Search","description":"Prepare a professional advisory report for code-aware similarity search using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfCodeAwareSimilarity({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
