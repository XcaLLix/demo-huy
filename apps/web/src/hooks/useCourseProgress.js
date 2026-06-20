import { useState, useEffect, useCallback } from 'react';
import { enrollmentService } from '../services/enrollmentService';

export default function useCourseProgress(courseId, currentUser, lessonsCount) {
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin preview mode: never load or save any progress to DB
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'ADMIN';

  // Load progress initially
  useEffect(() => {
    let active = true;
    (async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        if (isAdmin) {
          // Admin: always start fresh, no DB query, no log
          if (active) setCompletedLessons([]);
        } else if (currentUser) {
          const completedIds = await enrollmentService.getEnrolledCourseProgress(currentUser.id, courseId);
          if (active) {
            setCompletedLessons(completedIds || []);
          }
        } else {
          // Unauthenticated/Guest fallback
          const saved = localStorage.getItem(`course_${courseId}_completed_lessons`);
          if (saved && active) {
            setCompletedLessons(JSON.parse(saved));
          } else if (active) {
            setCompletedLessons([]);
          }
        }
      } catch (err) {
        console.warn('[useCourseProgress] Failed to load course progress:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [courseId, currentUser, isAdmin]);

  const toggleCompleted = useCallback(async (lessonId) => {
    if (!lessonId) return;

    setCompletedLessons(prev => {
      const numericId = Number(lessonId);
      const isCompleted = prev.includes(numericId);
      const next = isCompleted
        ? prev.filter(id => id !== numericId)
        : [...prev, numericId];
      
      if (isAdmin) {
        // Admin preview: only update local state, never write to DB
        return next;
      }

      // Save locally as backup for guests
      if (!currentUser) {
        localStorage.setItem(`course_${courseId}_completed_lessons`, JSON.stringify(next));
      }
      
      // Trigger async DB sync if logged in (students only)
      if (currentUser) {
        enrollmentService.updateLessonProgress(currentUser.id, numericId, !isCompleted)
          .catch(err => console.error('[useCourseProgress] DB progress update failed:', err));
      }

      return next;
    });
  }, [courseId, currentUser, isAdmin]);

  const progressPercent = lessonsCount > 0
    ? Math.round((completedLessons.length / lessonsCount) * 100)
    : 0;

  return {
    completedLessons,
    toggleCompleted,
    progressPercent,
    loading
  };
}
