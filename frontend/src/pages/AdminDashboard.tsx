/**
 * Admin Dashboard Page
 * 
 * Dashboard for admin users with management capabilities
 * Features:
 * - Admin-only access protection
 * - Overview of system statistics
 * - Quick access to admin functions
 * - User management capabilities
 * - Content management tools
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, queryKeys } from '../services/api';
import { 
  UsersIcon, 
  BookOpenIcon, 
  CogIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: queryKeys.admin.dashboardStats(),
    queryFn: adminApi.getDashboardStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Enrichment mutation
  const enrichmentMutation = useMutation({
    mutationFn: adminApi.triggerEnrichment,
    onSuccess: (data) => {
      alert(`Enrichment ${data.started ? 'started' : 'failed'}: ${data.message}`);
      // Refresh stats after enrichment starts
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboardStats() });
    },
    onError: (error) => {
      console.error('Enrichment failed:', error);
      alert('Failed to start enrichment process');
    },
  });

  const handleRunEnrichment = async () => {
    if (confirm('Are you sure you want to start the enrichment process?')) {
      setEnrichmentLoading(true);
      try {
        await enrichmentMutation.mutateAsync();
      } finally {
        setEnrichmentLoading(false);
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="admin-dashboard flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-dashboard min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.user_metadata?.full_name || user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error State */}
        {statsError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Error loading dashboard statistics. Please check if the backend API is running.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Items</span>
                <span className="font-medium text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                  ) : (
                    dashboardStats?.library?.total_items || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Enriched Items</span>
                <span className="font-medium text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                  ) : (
                    dashboardStats?.library?.enrichment_stats?.enriched || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Items</span>
                <span className="font-medium text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                  ) : (
                    dashboardStats?.library?.enrichment_stats?.pending || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Status</span>
                <span className={`font-medium ${dashboardStats?.system?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  ) : (
                    dashboardStats?.system?.status || 'Unknown'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <UsersIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="font-medium text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  ) : (
                    dashboardStats?.users?.total || 1
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="font-medium text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  ) : (
                    dashboardStats?.users?.active || 1
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Admin Users</span>
                <span className="font-medium text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  ) : (
                    dashboardStats?.users?.admin || 1
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Content Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpenIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Content Management</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                Manage Library Items
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                Enrichment Status
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                Bulk Operations
              </button>
            </div>
          </div>

          {/* System Tools */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CogIcon className="h-6 w-6 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">System Tools</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                System Settings
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                API Health Check
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                View Logs
              </button>
            </div>
          </div>

          {/* Database Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ServerIcon className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Database Management</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                Database Status
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                Run Migrations
              </button>
              <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                Backup Database
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleRunEnrichment}
                disabled={enrichmentLoading || enrichmentMutation.isPending}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                {(enrichmentLoading || enrichmentMutation.isPending) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Running...</span>
                  </>
                ) : (
                  <span>Run Enrichment</span>
                )}
              </button>
              <button 
                disabled
                className="w-full bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed transition-colors text-sm font-medium"
                title="Coming soon"
              >
                Sync Data (Coming Soon)
              </button>
              <button 
                disabled
                className="w-full bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed transition-colors text-sm font-medium"
                title="Coming soon"
              >
                Generate Report (Coming Soon)
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ChartBarIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
              <p className="text-gray-600">
                Activity logs and system events will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;