import type { Issue, Member } from '../data/mockData'

interface Props {
  issues: Issue[]
  members: Member[]
  onSelectIssue: (id: string) => void
  selectedIssueId: string | null
  onStatusChange: (id: string, status: Issue['status']) => void
}

const columns: { id: Issue['status']; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const priorityDot: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-gray-500',
}

const priorityLabel: Record<string, string> = {
  urgent: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-500',
}

const labelColors = [
  'bg-blue-900/50 text-blue-300 border-blue-800',
  'bg-purple-900/50 text-purple-300 border-purple-800',
  'bg-green-900/50 text-green-300 border-green-800',
  'bg-rose-900/50 text-rose-300 border-rose-800',
  'bg-amber-900/50 text-amber-300 border-amber-800',
]

export default function KanbanBoard({ issues, members, onSelectIssue, selectedIssueId }: Props) {
  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-3 h-full p-4 min-w-max">
        {columns.map(col => {
          const colIssues = issues.filter(i => i.status === col.id)
          return (
            <div key={col.id} className="w-64 flex flex-col h-full">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className="text-xs font-semibold text-gray-400">{col.label}</span>
                <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full font-mono">{colIssues.length}</span>
                <button className="ml-auto text-gray-600 hover:text-gray-400 text-sm w-5 h-5 flex items-center justify-center rounded hover:bg-gray-800">+</button>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {colIssues.map(issue => {
                  const assignee = members.find(m => m.id === issue.assigneeId)
                  const isSelected = selectedIssueId === issue.id
                  return (
                    <div
                      key={issue.id}
                      onClick={() => onSelectIssue(issue.id)}
                      className={`bg-gray-900 rounded-lg border p-2.5 cursor-pointer transition-all hover:border-gray-600 ${
                        isSelected ? 'border-violet-600 ring-1 ring-violet-600/50' : 'border-gray-800'
                      }`}
                    >
                      {/* Priority + ID */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${priorityDot[issue.priority]}`} />
                        <span className="text-xs text-gray-600 font-mono">{issue.id}</span>
                        {assignee && (
                          <div className={`ml-auto w-5 h-5 rounded-full ${assignee.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                            {assignee.initials[0]}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div className="text-xs text-gray-200 font-medium leading-tight mb-2">{issue.title}</div>

                      {/* Labels */}
                      {issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {issue.labels.slice(0, 2).map((label, i) => (
                            <span key={label} className={`text-xs border px-1.5 py-0.5 rounded text-[10px] ${labelColors[i % labelColors.length]}`}>
                              {label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Priority text */}
                      <div className={`text-xs mt-1.5 capitalize ${priorityLabel[issue.priority]}`}>
                        {issue.priority}
                      </div>
                    </div>
                  )
                })}
                {colIssues.length === 0 && (
                  <div className="text-xs text-gray-700 text-center py-6 border border-dashed border-gray-800 rounded-lg">
                    No issues
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
