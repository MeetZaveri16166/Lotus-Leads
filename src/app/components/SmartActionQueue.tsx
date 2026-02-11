import React, { useState } from "react";
import { 
  Zap,
  AlertCircle,
  Flame,
  Clock,
  TrendingUp,
  ChevronRight,
  Calendar,
  MessageSquare,
  Phone,
  X,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react";

type Lead = any;
type ActivityLog = any;

interface SmartAction {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  type: 'overdue' | 'hot_engagement' | 'hot_not_contacted' | 'stalled' | 'high_value';
  lead: Lead;
  title: string;
  reasoning: string[];
  estimatedValue: number;
  actions: ActionButton[];
}

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  type: 'note' | 'schedule' | 'contact' | 'snooze';
}

interface SmartActionQueueProps {
  leads: Lead[];
  activities: ActivityLog[];
  onNavigateToLead: (leadId: string) => void;
  onAddActivity: (leadId: string, type: string) => void;
  onScheduleFollowUp: (leadId: string, days: number) => void;
}

export function SmartActionQueue({ 
  leads, 
  activities, 
  onNavigateToLead,
  onAddActivity,
  onScheduleFollowUp
}: SmartActionQueueProps) {
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  // Generate smart actions
  const smartActions: SmartAction[] = React.useMemo(() => {
    const actions: SmartAction[] = [];
    const now = new Date();

    leads.forEach(lead => {
      const leadActivities = activities.filter(a => a.lead_id === lead.id);
      
      // Calculate estimated value
      let estimatedValue = 0;
      if (lead.company_revenue && typeof lead.company_revenue === 'string') {
        const revenueStr = lead.company_revenue.replace(/[$,]/g, '');
        const match = revenueStr.match(/(\d+(?:\.\d+)?)(M|K|B)?/i);
        if (match) {
          let value = parseFloat(match[1]);
          const unit = match[2]?.toUpperCase();
          if (unit === 'M') value *= 1000000;
          else if (unit === 'K') value *= 1000;
          else if (unit === 'B') value *= 1000000000;
          estimatedValue = value * 0.01;
        }
      } else {
        if (lead.qualification_level === 'hot') estimatedValue = 50000;
        else if (lead.qualification_level === 'warm') estimatedValue = 30000;
        else estimatedValue = 10000;
      }

      // 1. CRITICAL: Overdue follow-ups
      const overdueFollowUps = leadActivities.filter(a => 
        a.follow_up_date && 
        !a.follow_up_completed && 
        new Date(a.follow_up_date) < now
      );
      
      if (overdueFollowUps.length > 0) {
        const mostOverdue = overdueFollowUps.sort((a, b) => 
          new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime()
        )[0];
        const daysOverdue = Math.floor((now.getTime() - new Date(mostOverdue.follow_up_date).getTime()) / (1000 * 60 * 60 * 24));
        
        const reasoning = [
          `⏰ Follow-up ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
          `💰 $${Math.round(estimatedValue).toLocaleString()} opportunity at risk`,
          lead.qualification_level === 'hot' ? '🔥 Hot lead - immediate action required' : '',
          `📊 ${lead.status.charAt(0).toUpperCase() + lead.status.slice(1)} stage`
        ].filter(Boolean);

        actions.push({
          id: `overdue-${lead.id}`,
          priority: 'critical',
          type: 'overdue',
          lead,
          title: `Follow up with ${lead.first_name} ${lead.last_name} at ${lead.company_name}`,
          reasoning,
          estimatedValue,
          actions: [
            { label: 'Quick Note', icon: <MessageSquare className="w-3 h-3" />, type: 'note' },
            { label: 'Schedule Call', icon: <Phone className="w-3 h-3" />, type: 'schedule' },
            { label: '+1 Day', icon: <Calendar className="w-3 h-3" />, type: 'snooze' }
          ]
        });
      }

      // 2. HIGH: Hot leads with recent activity (engagement spike)
      if (lead.qualification_level === 'hot' && leadActivities.length > 0) {
        const recentActivity = leadActivities.filter(a => {
          const daysSince = (now.getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return daysSince < 2;
        });

        if (recentActivity.length >= 2) {
          const reasoning = [
            `🔥 Hot lead with ${recentActivity.length} activities in last 48 hours`,
            `💪 Strong engagement momentum - strike while hot`,
            `💰 $${Math.round(estimatedValue).toLocaleString()} opportunity`,
            `📈 ${lead.status === 'contacted' ? 'Ready to qualify' : 'Continue momentum'}`
          ];

          actions.push({
            id: `hot-engagement-${lead.id}`,
            priority: 'high',
            type: 'hot_engagement',
            lead,
            title: `Capitalize on ${lead.first_name}'s engagement at ${lead.company_name}`,
            reasoning,
            estimatedValue,
            actions: [
              { label: 'Schedule Meeting', icon: <Calendar className="w-3 h-3" />, type: 'schedule' },
              { label: 'Quick Call', icon: <Phone className="w-3 h-3" />, type: 'contact' },
              { label: 'Send Proposal', icon: <MessageSquare className="w-3 h-3" />, type: 'note' }
            ]
          });
        }
      }

      // 3. HIGH: Hot leads not contacted
      if (lead.qualification_level === 'hot') {
        const hasOutreach = leadActivities.some(a => 
          a.activity_type === 'call' || a.activity_type === 'email'
        );
        
        if (!hasOutreach) {
          const daysSinceCreated = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
          
          const reasoning = [
            `🔥 Hot qualified lead - no outreach yet`,
            `⚡ Contact within 24 hours increases conversion 3x`,
            `💰 $${Math.round(estimatedValue).toLocaleString()} potential deal value`,
            daysSinceCreated < 3 ? '✨ Fresh lead - optimal timing' : `⏳ ${Math.round(daysSinceCreated)} days old - act now`
          ];

          actions.push({
            id: `hot-not-contacted-${lead.id}`,
            priority: 'high',
            type: 'hot_not_contacted',
            lead,
            title: `Initial outreach to ${lead.first_name} at ${lead.company_name}`,
            reasoning,
            estimatedValue,
            actions: [
              { label: 'Call Now', icon: <Phone className="w-3 h-3" />, type: 'contact' },
              { label: 'Send Email', icon: <MessageSquare className="w-3 h-3" />, type: 'note' },
              { label: 'Schedule', icon: <Calendar className="w-3 h-3" />, type: 'schedule' }
            ]
          });
        }
      }

      // 4. MEDIUM: Stalled leads (contacted but not progressing)
      if (lead.status === 'contacted' && lead.qualification_level === 'hot') {
        const daysSinceCreated = (now.getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const lastActivity = leadActivities.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        const daysSinceLastActivity = lastActivity 
          ? (now.getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
          : daysSinceCreated;

        if (daysSinceCreated > 5 && daysSinceLastActivity > 3) {
          const reasoning = [
            `📊 Contacted ${Math.round(daysSinceCreated)} days ago - ready to qualify`,
            `⏰ No activity in ${Math.round(daysSinceLastActivity)} days - momentum lost`,
            `🔥 Hot lead at risk of going cold`,
            `💰 $${Math.round(estimatedValue).toLocaleString()} - worth the effort`
          ];

          actions.push({
            id: `stalled-${lead.id}`,
            priority: 'medium',
            type: 'stalled',
            lead,
            title: `Re-engage ${lead.first_name} at ${lead.company_name}`,
            reasoning,
            estimatedValue,
            actions: [
              { label: 'Follow Up', icon: <MessageSquare className="w-3 h-3" />, type: 'note' },
              { label: 'Call', icon: <Phone className="w-3 h-3" />, type: 'contact' },
              { label: 'Schedule', icon: <Calendar className="w-3 h-3" />, type: 'schedule' }
            ]
          });
        }
      }

      // 5. MEDIUM: High-value prospects with no recent activity
      if (estimatedValue > 40000 && lead.status !== 'won' && lead.status !== 'lost') {
        const lastActivity = leadActivities.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        const daysSinceLastActivity = lastActivity 
          ? (now.getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
          : 999;

        if (daysSinceLastActivity > 7 && actions.filter(a => a.lead.id === lead.id).length === 0) {
          const reasoning = [
            `💎 High-value opportunity ($${Math.round(estimatedValue).toLocaleString()})`,
            `📉 No activity in ${Math.round(daysSinceLastActivity)} days`,
            lead.qualification_level === 'warm' ? '🟡 Warm lead - maintain engagement' : '🔵 Cold lead - needs nurturing',
            `📊 Currently in ${lead.status} stage`
          ];

          actions.push({
            id: `high-value-${lead.id}`,
            priority: 'medium',
            type: 'high_value',
            lead,
            title: `Check in with ${lead.first_name} at ${lead.company_name}`,
            reasoning,
            estimatedValue,
            actions: [
              { label: 'Send Update', icon: <MessageSquare className="w-3 h-3" />, type: 'note' },
              { label: 'Schedule Call', icon: <Calendar className="w-3 h-3" />, type: 'schedule' },
              { label: '+3 Days', icon: <Clock className="w-3 h-3" />, type: 'snooze' }
            ]
          });
        }
      }
    });

    // Sort by priority and estimated value
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    return actions
      .sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.estimatedValue - a.estimatedValue;
      })
      .slice(0, 10); // Top 10 actions
  }, [leads, activities]);

  // Filter out dismissed actions
  const visibleActions = smartActions.filter(action => !dismissedActions.has(action.id));

  const handleDismiss = (actionId: string) => {
    setDismissedActions(prev => new Set([...prev, actionId]));
  };

  const handleQuickAction = (action: SmartAction, buttonType: string) => {
    switch (buttonType) {
      case 'note':
        onAddActivity(action.lead.id, 'note');
        break;
      case 'contact':
        onAddActivity(action.lead.id, 'call');
        break;
      case 'schedule':
        onScheduleFollowUp(action.lead.id, 1);
        break;
      case 'snooze':
        onScheduleFollowUp(action.lead.id, 1);
        break;
    }
    handleDismiss(action.id);
  };

  const priorityConfig = {
    critical: {
      icon: <AlertCircle className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-700',
      label: 'URGENT'
    },
    high: {
      icon: <Flame className="w-5 h-5" />,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      badgeColor: 'bg-orange-100 text-orange-700',
      label: 'HIGH PRIORITY'
    },
    medium: {
      icon: <TrendingUp className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-700',
      label: 'RECOMMENDED'
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#E64B8B]/5 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E64B8B] rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                🎯 Smart Action Queue
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">AI-prioritized actions based on real-time analysis</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500">{visibleActions.length} action{visibleActions.length !== 1 ? 's' : ''}</p>
            <p className="text-xs text-[#E64B8B] font-semibold">Live Queue</p>
          </div>
        </div>
      </div>

      {visibleActions.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-sm text-gray-900 font-semibold mb-1">All caught up! 🎉</p>
          <p className="text-xs text-gray-500">No urgent actions at the moment. Great work!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {visibleActions.map((action, index) => {
            const config = priorityConfig[action.priority];
            const name = `${action.lead.first_name} ${action.lead.last_name}`.trim();
            const company = action.lead.company_name;

            return (
              <div
                key={action.id}
                className={`relative group hover:bg-gray-50 transition-colors border-l-4 ${config.borderColor}`}
              >
                <div className="px-6 py-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Priority Icon */}
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor} flex-shrink-0`}>
                        <span className={config.iconColor}>{config.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${config.badgeColor}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-1">{action.title}</p>
                        
                        {/* Reasoning */}
                        <div className="space-y-1 mb-3">
                          {action.reasoning.map((reason, idx) => (
                            <p key={idx} className="text-xs text-gray-600 leading-relaxed">
                              {reason}
                            </p>
                          ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                          {action.actions.map((btn, btnIdx) => (
                            <button
                              key={btnIdx}
                              onClick={() => handleQuickAction(action, btn.type)}
                              className="px-3 py-1.5 bg-[#E64B8B] hover:bg-[#d43d7a] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              {btn.icon}
                              {btn.label}
                            </button>
                          ))}
                          <button
                            onClick={() => onNavigateToLead(action.lead.id)}
                            className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <ChevronRight className="w-3 h-3" />
                            View Lead
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={() => handleDismiss(action.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer */}
      {visibleActions.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">
                  {visibleActions.filter(a => a.priority === 'critical').length} Urgent
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">
                  {visibleActions.filter(a => a.priority === 'high').length} High Priority
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">
                  {visibleActions.filter(a => a.priority === 'medium').length} Recommended
                </span>
              </div>
            </div>
            <p className="text-gray-500 font-medium">
              Total Opportunity Value: <span className="text-gray-900 font-bold">
                ${Math.round(visibleActions.reduce((sum, a) => sum + a.estimatedValue, 0)).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
