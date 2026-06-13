import HeroSection from './HeroSection';
import TodayMission from './TodayMission';
import AiCoachCard from './AiCoachCard';
import ScorePrediction from './ScorePrediction';
import RoadmapTimeline from './RoadmapTimeline';
import RecentExams from './RecentExams';
import PerformanceAnalytics from './PerformanceAnalytics';
import Achievements from './Achievements';
import UpcomingTasks from './UpcomingTasks';

export default function StudentDashboard({ currentUser, setActiveTab, navigateTo }) {
  const handleNavigate = (section) => {
    if (section === 'courses') {
      navigateTo('/courses');
    } else if (section === 'tests') {
      navigateTo('/mock-exams');
    } else {
      setActiveTab(section);
    }
  };

  return (
    <div className="student-dashboard">
      {/* SECTION 1: Hero */}
      <HeroSection
        currentUser={currentUser}
        onStartLearning={() => navigateTo('/courses')}
        onNavigateTo={handleNavigate}
      />

      {/* SECTION 2 + 3: Mission & AI Coach (side by side on large screens) */}
      <div className="student-dashboard__row student-dashboard__row--mission">
        <TodayMission onNavigateTo={handleNavigate} />
        <AiCoachCard onNavigateTo={handleNavigate} />
      </div>

      {/* SECTION 4: Score prediction radar */}
      <ScorePrediction currentUser={currentUser} />

      {/* SECTION 5: Roadmap timeline */}
      <RoadmapTimeline onNavigateTo={handleNavigate} />

      {/* SECTION 6: Recent exams */}
      <RecentExams onNavigateTo={handleNavigate} />

      {/* SECTION 7 + 8: Performance + Achievements */}
      <div className="student-dashboard__row student-dashboard__row--analytics">
        <PerformanceAnalytics onNavigateTo={handleNavigate} />
        <div className="student-dashboard__col-right">
          <Achievements />
          <UpcomingTasks onNavigateTo={handleNavigate} />
        </div>
      </div>
    </div>
  );
}
