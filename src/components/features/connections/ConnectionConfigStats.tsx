import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConnectionImpact, getConnectionUsageStats } from '@/lib/api';
import ConfigurationTabContent from './ConfigurationTabContent';

const ConnectionConfigStats = ({ connection, connectionId }: { connection: any; connectionId: number }) => {
    // Fetch Impact Analysis
    const {
        data: impactData,
        isLoading: loadingImpact
    } = useQuery({
        queryKey: ['connectionImpact', connectionId],
        queryFn: () => getConnectionImpact(connectionId),
        enabled: !!connection,
    });

    // Fetch Usage Stats
    const {
        data: usageStats,
        isLoading: loadingUsageStats
    } = useQuery({
        queryKey: ['connectionUsageStats', connectionId],
        queryFn: () => getConnectionUsageStats(connectionId),
        enabled: !!connection,
    });

    return (
        <ConfigurationTabContent
            connection={connection}
            impactData={impactData}
            loadingImpact={loadingImpact}
            usageStats={usageStats}
            loadingUsageStats={loadingUsageStats}
        />
    );
};

export default ConnectionConfigStats;
