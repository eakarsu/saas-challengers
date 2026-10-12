import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-git-integration","title":"Git Integration Tables","description":"Prepare a professional advisory report for git integration tables using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapGitIntegration({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
