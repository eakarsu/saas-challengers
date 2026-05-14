import { useState } from 'react'

interface Props {
  projectName: string
  onClose: () => void
  onAddToBacklog: (issues: { title: string; description: string }[]) => void
}

const suggestionSets: Record<string, { title: string; description: string }[]> = {
  default: [
    {
      title: 'Set up E2E test suite with Playwright',
      description: 'Add end-to-end test coverage for critical user flows: login, project creation, issue management, and settings.',
    },
    {
      title: 'Implement activity feed for workspace',
      description: 'Show a real-time stream of all issue changes, comments, and assignments in a centralized workspace feed.',
    },
    {
      title: 'Add keyboard shortcut system',
      description: 'Global keyboard shortcuts for common actions: new issue (C), search (K), navigate between issues (J/K), archive (E).',
    },
    {
      title: 'Build bulk issue operations',
      description: 'Allow users to select multiple issues and perform bulk status changes, label assignments, and priority updates.',
    },
    {
      title: 'Add issue linking and dependencies',
      description: 'Link issues as "blocks", "blocked by", or "related to". Show dependency graph view for cycle planning.',
    },
  ],
  performance: [
    {
      title: 'Add virtual scrolling for large issue lists',
      description: 'Use windowing technique to render only visible issues, supporting workspaces with 10k+ issues without slowdown.',
    },
    {
      title: 'Implement request caching with SWR',
      description: 'Cache API responses locally with stale-while-revalidate strategy to reduce latency and improve perceived performance.',
    },
    {
      title: 'Optimize bundle with code splitting',
      description: 'Split large routes into async chunks. Target < 100KB initial bundle to improve first load performance.',
    },
    {
      title: 'Add database query analyzer',
      description: 'Build an admin panel showing slow queries, N+1 patterns, and index usage. Alert when queries exceed 200ms threshold.',
    },
    {
      title: 'Implement background sync for offline-first support',
      description: 'Queue mutations when offline, sync when connection restores. Show pending sync indicator in UI.',
    },
  ],
  mobile: [
    {
      title: 'Add pull-to-refresh on all list views',
      description: 'Native-feeling pull-to-refresh gesture on issue boards, project lists, and activity feeds.',
    },
    {
      title: 'Build push notification preferences screen',
      description: 'Allow users to configure which events trigger push notifications: @mentions, assignments, due dates, comments.',
    },
    {
      title: 'Implement swipe-to-archive on issue cards',
      description: 'Swipe left to archive, right to mark done. With haptic feedback and undo toast.',
    },
    {
      title: 'Add widget support for home screen',
      description: 'iOS/Android home screen widgets showing today\'s assigned issues, unread count, and cycle progress.',
    },
    {
      title: 'Optimize images for retina/high-DPI displays',
      description: 'Serve 2x/3x assets for avatar images and icons on high-density screens.',
    },
  ],
}

export default function AISuggest({ projectName, onClose, onAddToBacklog }: Props) {
  const [context, setContext] = useState('')
  const [suggestions, setSuggestions] = useState<{ title: string; description: string }[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerate = () => {
    if (!context.trim()) return
    setLoading(true)
    setTimeout(() => {
      const key = context.toLowerCase().includes('performance') ? 'performance'
        : context.toLowerCase().includes('mobile') ? 'mobile'
        : 'default'
      setSuggestions(suggestionSets[key])
      setSelected(new Set([0, 1, 2, 3, 4]))
      setGenerated(true)
      setLoading(false)
    }, 900)
  }

  const toggleAll = () => {
    if (selected.size === suggestions.length) setSelected(new Set())
    else setSelected(new Set(suggestions.map((_, i) => i)))
  }

  const handleAdd = () => {
    const toAdd = suggestions.filter((_, i) => selected.has(i))
    onAddToBacklog(toAdd)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-violet-400">✦</span>
            <span className="text-sm font-semibold text-white">AI Issue Suggestions</span>
            <span className="text-xs text-gray-500">for {projectName}</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Context input */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Describe what you're building or a problem area</label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. We're building offline support for mobile, and need better performance across the board..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-violet-600 placeholder-gray-600"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!context.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>✦ Generate Issues</>
            )}
          </button>

          {/* Suggestions checklist */}
          {generated && suggestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-400">{selected.size} of {suggestions.length} selected</div>
                <button onClick={toggleAll} className="text-xs text-violet-400 hover:text-violet-300">
                  {selected.size === suggestions.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const n = new Set(selected)
                      n.has(i) ? n.delete(i) : n.add(i)
                      setSelected(n)
                    }}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected.has(i) ? 'border-violet-700 bg-violet-900/20' : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${selected.has(i) ? 'bg-violet-600 border-violet-600' : 'border-gray-600'}`}>
                      {selected.has(i) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-200">{s.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAdd}
                disabled={selected.size === 0}
                className="w-full mt-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
              >
                Add {selected.size} Issue{selected.size !== 1 ? 's' : ''} to Backlog
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
