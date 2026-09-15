import React from 'react';
import { Network, PlusCircle, Activity, MessageSquareWarning, ShieldAlert, FileCheck2 } from 'lucide-react';

export type TabType = 'clusters' | 'propose' | 'proposals' | 'objections' | 'consume' | 'evidence';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'clusters', label: 'Cluster Explorer', icon: Network, badge: null },
    { id: 'propose', label: 'Propose Alias Set', icon: PlusCircle, badge: null },
    { id: 'proposals', label: 'Assessment Tracker', icon: Activity, badge: null },
    { id: 'objections', label: 'File Objection', icon: MessageSquareWarning, badge: null },
    { id: 'consume', label: 'Incident Consumer', icon: ShieldAlert, badge: 'Exact-Once' },
    { id: 'evidence', label: 'Evidence', icon: FileCheck2, badge: null },
  ] as const;

  return (
    <nav className="border-b border-gray-800 bg-gray-900/30 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
