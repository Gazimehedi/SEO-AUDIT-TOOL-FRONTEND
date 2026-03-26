import { Session } from 'next-auth';

export interface ExtendedSession extends Session {
    accessToken?: string;
    refreshToken?: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}


export interface AdminStats {
    users: number;
    audits: {
        total: number;
        complete: number;
        pending: number;
        failed: number;
        avgScore: number;
    };
    system: {
        platform: string;
        cpuCount: number;
        freeMem: string;
        totalMem: string;
        uptime: string;
    };
}

export interface AdminUser {
    id: string;
    name: string | null;
    email: string;
    role: string;
    _count: {
        audits: number;
    };
}

export interface AuditIssue {
    category: string;
    severity: 'Critical' | 'Warning' | 'Passed' | 'Info';
    issue: string;
    description?: string;
    recommendation?: string;
    pageUrl?: string;
    location?: string;
    code_example?: string;
}

export interface AISummary {
    executiveSummary: string;
    topPriorities: string[];
    quickWins: string[];
    estimatedImpact: 'Low' | 'Medium' | 'High';
}

export interface AuditData {
    id: string;
    url: string;
    status: string;
    score: number | null;
    results: {
        title: string;
        description: string;
        issues: AuditIssue[];
        performanceScore?: number;
        pageMetadata?: Record<string, {
            keywords?: { word: string; count: number; density: number }[];
        }>;
        performanceMetrics?: {
            lcp?: number;
            cls?: number;
            loadTime?: number;
            fcp?: number;
            ttfb?: number;
            speedIndex?: number;
            isCompressed?: boolean;
            contentSize?: number;
            cacheHits?: number;
        };
        mobileResult?: {
            score: number;
            issues: AuditIssue[];
        };
        competitors?: {
            id: string;
            url: string;
            score: number;
            performanceScore: number;
            lcp: number;
            status: string;
        }[];
    };
    aiSummary?: AISummary | null;
    createdAt: string;
}

export interface MonitoredSite {
    id: string;
    url: string;
    interval: 'daily' | 'weekly';
    lastScore: number | null;
    previousScore: number | null;
    lastAuditedAt: string | null;
    createdAt: string;
}

export interface AuditHistoryItem {
    id: string;
    url: string;
    score: number;
    createdAt: string;
    results?: {
        title?: string;
    };
}

export interface AuditContext {
    url?: string;
    score?: number;
    issues?: AuditIssue[];
}

export interface Project {
    id: string;
    name: string;
    description: string | null;
    _count: { audits: number; monitoredSites: number; };
    createdAt: string;
}

export interface ProjectDetail extends Project {
    audits: AuditHistoryItem[];
    monitoredSites: MonitoredSite[];
}

export interface UserProfile {
    id: string;
    email: string;
    name?: string | null;
    bio?: string | null;
    role?: string;
    avatarUrl?: string | null;
    reportLogoUrl?: string | null;
    notifyOnScoreDrop: boolean;
    notifyWeekly: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    stats?: {
        totalAudits: number;
        totalProjects: number;
        avgScore: number;
    };
}

export interface ApiKey {
    id: string;
    label: string;
    key?: string;
    createdAt: string;
    lastUsedAt?: string;
    lastUsed?: string; // Component uses this
}
