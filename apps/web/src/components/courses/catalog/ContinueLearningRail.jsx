import React, { useMemo } from 'react';
import { HiPlay } from 'react-icons/hi';

export default function ContinueLearningRail({ currentUser, courses, onSelectCourse, progresses = {} }) {
  const enrolledCourses = useMemo(() => {
    if (!currentUser || !courses) return [];
    const unlocked = currentUser.unlockedCourses || [];
    return courses.filter(c => unlocked.includes(Number(c.id)) || unlocked.includes(c.id.toString()));
  }, [currentUser, courses]);

  if (enrolledCourses.length === 0) return null;

  return (
    <div className="continue-learning-section">
      <h2 className="catalog-section-title">Tiếp tục học</h2>
      <div className="continue-learning-rail">
        {enrolledCourses.map((course) => {
          const progressKey = `course_progress_percent_${course.id}`;
          const progressPercent = (progresses[course.id] ?? Number(localStorage.getItem(progressKey))) || 0;
          
          // Extract next lesson title
          const nextLessonTitle = course.curriculum?.[0]?.lessons?.[0]?.title || 'Bài học tiếp theo';

          return (
            <div
              key={course.id}
              className="continue-learning-card"
              onClick={() => onSelectCourse(course)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectCourse(course);
                }
              }}
            >
              <div className="continue-learning-card__thumb">
                <img
                  src={course.thumbnail || '/course_thumb_math.png'}
                  alt={course.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop';
                  }}
                />
                <div className="continue-learning-card__play">
                  <HiPlay />
                </div>
              </div>
              <div className="continue-learning-card__body">
                <span className="continue-learning-card__subject">{course.subject}</span>
                <h3 className="continue-learning-card__title">{course.title}</h3>
                
                <div className="continue-learning-card__next">
                  <strong>Học tiếp:</strong> {nextLessonTitle}
                </div>

                <div className="continue-learning-card__progress">
                  <div className="continue-learning-card__progress-bar">
                    <div
                      className="continue-learning-card__progress-bar-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="continue-learning-card__progress-num">
                    {progressPercent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
