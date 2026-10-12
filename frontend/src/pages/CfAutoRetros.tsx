import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-auto-retros","title":"Auto-Generated Sprint Retros","description":"Prepare a professional advisory report for auto-generated sprint retros using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfAutoRetros({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
