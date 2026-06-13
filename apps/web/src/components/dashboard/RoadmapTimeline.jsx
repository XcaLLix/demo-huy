const STAGES = [
  {
    id: 'assessment',
    label: 'Đánh giá',
    icon: '🔍',
    color: '#7C3AED',
    topics: 12,
    done: 12,
    status: 'completed',
    desc: 'Kiểm tra kiến thức nền tảng',
  },
  {
    id: 'foundation',
    label: 'Nền tảng',
    icon: '🧱',
    color: '#0EA5E9',
    topics: 28,
    done: 22,
    status: 'completed',
    desc: 'Củng cố lý thuyết trọng tâm',
  },
  {
    id: 'acceleration',
    label: 'Tăng tốc',
    icon: '🚀',
    color: '#F59E0B',
    topics: 40,
    done: 18,
    status: 'active',
    desc: 'Luyện đề và nâng cao kỹ năng',
  },
  {
    id: 'mastery',
    label: 'Thành thạo',
    icon: '🏆',
    color: '#10B981',
    topics: 30,
    done: 0,
    status: 'locked',
    desc: 'Chuyên đề nâng cao & chiến lược thi',
  },
  {
    id: 'exam-ready',
    label: 'Sẵn sàng thi',
    icon: '🎓',
    color: '#EF4444',
    topics: 15,
    done: 0,
    status: 'locked',
    desc: 'Đề thi thử & ôn tập cuối kỳ',
  },
];

export default function RoadmapTimeline({ onNavigateTo }) {
  const activeIndex = STAGES.findIndex((s) => s.status === 'active');
  const totalDone = STAGES.reduce((a, b) => a + b.done, 0);
  const totalTopics = STAGES.reduce((a, b) => a + b.topics, 0);
  const overallPct = Math.round((totalDone / totalTopics) * 100);

  return (
    <div className="db-roadmap">
      {/* Header */}
      <div className="db-roadmap__header">
        <div>
          <span className="db-roadmap__eyebrow">🗺️ Lộ trình AI</span>
          <h2 className="db-roadmap__title">Tiến độ học tập</h2>
        </div>
        <div className="db-roadmap__overall">
          <span className="db-roadmap__overall-pct">{overallPct}%</span>
          <span className="db-roadmap__overall-label">hoàn thành</span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="db-roadmap__global-bar">
        <div className="db-roadmap__global-fill" style={{ width: `${overallPct}%` }} />
      </div>

      {/* Timeline */}
      <div className="db-roadmap__timeline">
        {STAGES.map((stage, idx) => {
          const pct = stage.topics ? Math.round((stage.done / stage.topics) * 100) : 0;
          const isActive = stage.status === 'active';
          const isCompleted = stage.status === 'completed';
          const isLocked = stage.status === 'locked';

          return (
            <div
              key={stage.id}
              className={`db-roadmap__stage ${isActive ? 'db-roadmap__stage--active' : ''} ${isCompleted ? 'db-roadmap__stage--done' : ''} ${isLocked ? 'db-roadmap__stage--locked' : ''}`}
              style={{ '--stage-color': stage.color }}
            >
              {/* Connector line */}
              {idx < STAGES.length - 1 && (
                <div
                  className="db-roadmap__connector"
                  style={{
                    background: isCompleted
                      ? `linear-gradient(90deg, ${stage.color}, ${STAGES[idx + 1].color})`
                      : 'rgba(0,0,0,0.08)',
                  }}
                />
              )}

              {/* Stage node */}
              <div className="db-roadmap__node">
                <div className="db-roadmap__node-icon">
                  {isLocked ? '🔒' : stage.icon}
                </div>
                {isActive && <div className="db-roadmap__pulse" />}
              </div>

              {/* Stage info */}
              <div className="db-roadmap__stage-info">
                <span className="db-roadmap__stage-label">{stage.label}</span>
                <span className="db-roadmap__stage-desc">{stage.desc}</span>

                {!isLocked && (
                  <div className="db-roadmap__stage-bar">
                    <div
                      className="db-roadmap__stage-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                <span className="db-roadmap__stage-count">
                  {isLocked ? 'Chưa mở khoá' : `${stage.done}/${stage.topics} chủ đề`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="db-roadmap__cta"
        onClick={() => onNavigateTo && onNavigateTo('path')}
        id="roadmap-view-full-btn"
      >
        Xem lộ trình đầy đủ →
      </button>
    </div>
  );
}
