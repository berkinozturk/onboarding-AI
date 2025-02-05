import React from 'react';
import Layout from '../../components/shared/Layout';
import { Award, Trophy, Star, Calendar, Building, Mail } from 'lucide-react';
import { useStore } from '../../store';

export default function EmployeeProfile() {
  const user = useStore((state) => state.user);

  // Format date to show only day, month, and year
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pt-8 space-y-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">{user?.name || 'User Name'}</h1>
                <p className="text-blue-100">{user?.position || 'Position'}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{user?.email || 'email@example.com'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <span>{user?.department || 'Department'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{user?.startDate ? formatDate(user.startDate) : 'Start Date'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Achievements</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Level {user?.level || 1}</p>
                      <p className="text-sm text-gray-500">{user?.xp || 0} XP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Onboarding Progress</p>
                      <p className="text-sm text-gray-500">{user?.progress || 0}% Complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Badges Earned</p>
                      <p className="text-sm text-gray-500">{user?.badges?.length || 0} Badges</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Badges</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {user?.badges?.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gray-50 p-4 rounded-lg flex flex-col items-center text-center"
                  >
                    <Award className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-sm text-gray-500">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}