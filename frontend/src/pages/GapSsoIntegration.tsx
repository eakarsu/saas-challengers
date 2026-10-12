import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-sso-integration","title":"SSO Integration","description":"Prepare a professional advisory report for sso integration using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapSsoIntegration({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
