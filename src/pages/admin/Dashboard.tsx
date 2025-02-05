import React from 'react';
import Layout from '../../components/shared/Layout';
import ProgressChart from '../../components/admin/ProgressChart';
import { useStore } from '../../store';

export default function Dashboard() {
  const { employees, questions, calculateEmployeeProgress, getAvgCompletionRate } = useStore();

  // Calculate total available badges from questions
  const totalAvailableBadges = questions.filter(q => q.badge).length;

  // Get average completion rate
  const avgCompletionRate = getAvgCompletionRate();

  // Get employee count
  const employeeCount = employees.filter(emp => emp.role === 'employee').length;

  // Calculate progress data for active employees
  const progressData = employees
    .filter(emp => emp.role === 'employee')
    .map(emp => {
      const progress = calculateEmployeeProgress(emp.id);
      return {
        name: emp.name,
        completionRate: progress,
        badges: emp.badges.length,
        badgePercentage: totalAvailableBadges > 0 
          ? Math.round((emp.badges.length / totalAvailableBadges) * 100)
          : 0,
        xp: emp.xp
      };
    });

  return (
    <Layout>
      <div className="pt-8 space-y-6">
        {/* Average Completion Rate Card */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Avg. Completion Rate ({employeeCount} Employees)</h3>
          <p className="text-3xl font-bold text-blue-600">{avgCompletionRate}%</p>
        </div>

        {/* Progress Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Onboarding Progress Overview</h3>
          <ProgressChart data={progressData} />
        </div>
      </div>
    </Layout>
  );
}