import React from 'react';
import ContinueLearningRail from './courses/catalog/ContinueLearningRail';

export default function CourseMall({ courses, currentUser, onSelectCourse, onLearnCourse }) {
  return (
    <div className="course-mall-container animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Continue Learning Rail */}
        <ContinueLearningRail 
          currentUser={currentUser}
          courses={courses}
          onSelectCourse={(course) => onLearnCourse ? onLearnCourse(course) : onSelectCourse(course)}
        />
      </div>
    </div>
  );
}
