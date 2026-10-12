import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-standup-summarizer","title":"Standup Summarizer","description":"Prepare a professional advisory report for standup summarizer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapStandupSummarizer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
