import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-agent-executable-spec","title":"Agent-Executable Issue Spec","description":"Prepare a professional advisory report for agent-executable issue spec using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfAgentExecutableSpec({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
