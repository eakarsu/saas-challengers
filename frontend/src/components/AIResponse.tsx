import AIReport from './AIReport';

interface Props { content: string; loading?: boolean; timestamp?: string; }

export default function AIResponse({ content, loading, timestamp }: Props) {
  return <AIReport response={content || null} loading={loading} title={timestamp ? `AI analysis · ${timestamp}` : 'AI analysis'} />;
}
