import type { Issue, Member } from '../data/mockData'

interface Props {
  issue: Issue
  members: Member[]
  onClose: () => void
  onStatusChange: (status: Issue['status']) => void
}

const statusOptions: Issue['status'][] = ['backlog', 'todo', 'in_progress', 'done']
const priorityOptions: Issue['priority'][] = ['urgent', 'high', 'medium', 'low']

const statusLabel: Record<Issue['status'], string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
}

const priorityColor: Record<Issue['priority'], string> = {
  urgent: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-500',
}

const activityIcon: Record<string, string> = {
  created: '○',
  status: '→',
  comment: '💬',
}

export default function IssueDetail({ issue, members, onClose, onStatusChange }: Props) {
  const assignee = members.find(m => m.id === issue.assigneeId)

  return (
    <div className="w-96 border-l border-gray-800 bg-gray-900 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-xs text-gray-500 font-mono">{issue.id}</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-lg leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white leading-snug">{issue.title}</h2>
          {issue.description && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{issue.description}</p>
          )}
        </div>

        {/* Properties */}
        <div className="px-4 py-3 space-y-3 border-b border-gray-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">Status</div>
              <select
                value={issue.status}
                onChange={e => onStatusChange(e.target.value as Issue['status'])}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-violet-600"
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">Priority</div>
              <select
                value={issue.priority}
                onChange={() => {}}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-violet-600"
              >
                {priorityOptions.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Assignee</div>
            {assignee ? (
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full ${assignee.color} flex items-center justify-center text-white font-bold text-xs`}>
                  {assignee.initials[0]}
                </div>
                <span className="text-xs text-gray-300">{assignee.name}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-600">Unassigned</span>
            )}
          </div>

          <div className="flex gap-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Labels</div>
              <div className="flex flex-wrap gap-1">
                {issue.labels.map(l => (
                  <span key={l} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{l}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">Created</div>
              <div className="text-xs text-gray-400">{issue.createdAt}</div>
            </div>
          </div>

          {issue.cycleId && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Cycle</div>
              <span className="text-xs bg-violet-900/40 border border-violet-700 text-violet-300 px-2 py-0.5 rounded">
                {issue.cycleId === 'cycle-1' ? 'Cycle 1 — May 2025' : issue.cycleId}
              </span>
            </div>
          )}

          <div>
            <div className="text-xs text-gray-600 mb-1">Priority</div>
            <span className={`text-xs font-semibold capitalize ${priorityColor[issue.priority]}`}>{issue.priority}</span>
          </div>
        </div>

        {/* Activity log */}
        <div className="px-4 py-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity</div>
          <div className="space-y-3">
            {issue.activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-gray-600 text-sm mt-0.5 flex-shrink-0">{activityIcon[a.type]}</span>
                <div>
                  <div className="text-xs text-gray-300">{a.text}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{a.ts}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
