import React from 'react';

function TopicPill({ name, accuracy, type }) {
  const isStrong = type === 'strong';
  const color = isStrong ? '#00b894' : '#e17055';
  const bg = isStrong ? '#00b89414' : '#e1705514';
  const border = isStrong ? '#00b89440' : '#e1705540';
  const pct = Math.round((accuracy || 0) * 100);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: bg, border: `1px solid ${border}`,
      borderRadius: '10px', gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '15px' }}>{isStrong ? '✅' : '❗'}</span>
        <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      </div>
      <span style={{
        fontSize: '12px', fontWeight: '800', color,
        background: `${color}18`, padding: '3px 9px',
        borderRadius: '99px', border: `1px solid ${color}40`,
        whiteSpace: 'nowrap', flexShrink: 0
      }}>
        {pct}%
      </span>
    </div>
  );
}

export default function CapabilityAnalysis({ topicStats = {}, difficultyStats = {} }) {
  const topics = Object.entries(topicStats)
    .map(([name, s]) => ({ name, ...s }))
    .filter(t => t.total > 0);

  const strongTopics = topics.filter(t => (t.accuracy || 0) >= 0.8).sort((a, b) => b.accuracy - a.accuracy);
  const weakTopics = topics.filter(t => (t.accuracy || 0) < 0.6).sort((a, b) => a.accuracy - b.accuracy);
  const midTopics = topics.filter(t => (t.accuracy || 0) >= 0.6 && (t.accuracy || 0) < 0.8);

  const overallAccuracy = topics.length > 0
    ? topics.reduce((sum, t) => sum + (t.accuracy || 0), 0) / topics.length
    : 0;

  const bestDiff = Object.entries(difficultyStats)
    .filter(([, s]) => s.total > 0)
    .sort(([, a], [, b]) => (b.accuracy || 0) - (a.accuracy || 0))[0];

  if (topics.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
        Chưa có dữ liệu phân tích năng lực
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Quick capability stats */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '120px', padding: '14px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>{topics.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Chủ đề</div>
        </div>
        <div style={{ flex: 1, minWidth: '120px', padding: '14px', background: '#00b89410', border: '1px solid #00b89430', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#00b894' }}>{strongTopics.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Chủ đề mạnh</div>
        </div>
        <div style={{ flex: 1, minWidth: '120px', padding: '14px', background: '#e1705510', border: '1px solid #e1705530', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#e17055' }}>{weakTopics.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Cần cải thiện</div>
        </div>
        <div style={{ flex: 1, minWidth: '120px', padding: '14px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)' }}>{Math.round(overallAccuracy * 100)}%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Tỷ lệ đúng TB</div>
        </div>
      </div>

      {/* Strong vs Weak split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#00b894', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            💪 Điểm mạnh ({strongTopics.length})
          </div>
          {strongTopics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {strongTopics.map(t => <TopicPill key={t.name} name={t.name} accuracy={t.accuracy} type="strong" />)}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px', background: 'var(--bg-main)', borderRadius: '10px', textAlign: 'center' }}>
              Chưa có chủ đề đạt ≥ 80%
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#e17055', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📚 Cần ôn luyện ({weakTopics.length})
          </div>
          {weakTopics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {weakTopics.map(t => <TopicPill key={t.name} name={t.name} accuracy={t.accuracy} type="weak" />)}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#00b894', padding: '12px', background: '#00b89410', borderRadius: '10px', textAlign: 'center' }}>
              🎉 Tất cả chủ đề đều ≥ 60%!
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {weakTopics.length > 0 && (
        <div style={{ padding: '14px 16px', background: 'var(--primary-bg)', border: '1px solid var(--primary-light)', borderRadius: '12px', fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          <strong>💡 Gợi ý ưu tiên:</strong> Tập trung ôn luyện{' '}
          <strong style={{ color: 'var(--primary)' }}>
            {weakTopics.slice(0, 3).map(t => t.name).join(', ')}
          </strong>{' '}
          — đây là những chủ đề có tỷ lệ đúng thấp nhất và ảnh hưởng nhiều nhất đến điểm tổng của bạn.
        </div>
      )}

      {bestDiff && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          🎯 Bạn làm tốt nhất ở mức <strong>{bestDiff[0] === 'EASY' ? 'Dễ' : bestDiff[0] === 'HARD' ? 'Khó' : 'Trung bình'}</strong> ({Math.round((bestDiff[1].accuracy || 0) * 100)}% đúng). {midTopics.length > 0 && `Còn ${midTopics.length} chủ đề trung bình cần cải thiện thêm.`}
        </div>
      )}
    </div>
  );
}
