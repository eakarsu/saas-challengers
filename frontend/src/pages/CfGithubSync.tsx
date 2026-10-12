import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-github-sync","title":"Zero-Config GitHub Sync","description":"Prepare a professional advisory report for zero-config github sync using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfGithubSync({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
