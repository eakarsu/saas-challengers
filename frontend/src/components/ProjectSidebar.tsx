import type { Project, Issue } from '../data/mockData'

interface Props {
  projects: Project[]
  selectedId: string
  onSelect: (id: string) => void
  issues: Issue[]
}

export default function ProjectSidebar({ projects, selectedId, onSelect, issues }: Props) {
  return (
    <div className="px-2 py-3">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Projects</div>
      <div className="space-y-0.5">
        {projects.map(p => {
          const count = issues.filter(i => i.projectId === p.id).length
          const isActive = selectedId === p.id
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full text-left px-2 py-2 rounded-lg transition-colors group ${
                isActive ? 'bg-gray-800' : 'hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.color}`} />
                <span className={`text-xs font-medium truncate flex-1 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  {p.name}
                </span>
                <span className="text-xs text-gray-600 font-mono">{count}</span>
              </div>
              <div className="text-xs text-gray-600 pl-4 mt-0.5">{p.lastActivity}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
