import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-webhook-ingest","title":"GitHub / Slack Webhook Ingest","description":"Prepare a professional advisory report for github / slack webhook ingest using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapWebhookIngest({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
