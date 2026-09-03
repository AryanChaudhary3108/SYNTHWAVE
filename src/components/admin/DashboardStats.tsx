import React, { useState, useEffect } from 'react';
import { SimpleGrid } from '@mantine/core';
import { supabase } from '../../supabase';
import StatCard from '../ui/StatCard';

const DashboardStats: React.FC = () => {
  interface Metric {
    title: string;
    value: string;
    interval: string;
    trend: 'neutral' | 'up' | 'down';
    trendValue: string;
    data: number[];
  }

  /* Applications and ticket metrics are temporarily disabled.
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      title: 'Applications',
      value: '0',
      interval: 'Last 30 days',
      trend: 'neutral' as 'neutral' | 'up' | 'down',
      trendValue: '+0%',
      data: [],
    },
    {
      title: 'Tickets',
      value: '0',
      interval: 'Last 30 days',
      trend: 'neutral' as 'neutral' | 'up' | 'down',
      trendValue: '+0%',
      data: [],
    },
  ]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const currentDate = new Date();
        const past30DaysDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        const past60DaysDate = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000);

        const { data: currentApplicationsData, error: currentApplicationsError } = await supabase
          .from('applications')
          .select('created_at')
          .gte('created_at', past30DaysDate.toISOString());

        if (currentApplicationsError) throw currentApplicationsError;

        const { data: currentTicketsData, error: currentTicketsError } = await supabase
          .from('tickets')
          .select('created_at')
          .gte('created_at', past30DaysDate.toISOString());

        if (currentTicketsError) throw currentTicketsError;

        const { data: previousApplicationsData, error: previousApplicationsError } = await supabase
          .from('applications')
          .select('created_at')
          .gte('created_at', past60DaysDate.toISOString())
          .lt('created_at', past30DaysDate.toISOString());

        if (previousApplicationsError) throw previousApplicationsError;

        const { data: previousTicketsData, error: previousTicketsError } = await supabase
          .from('tickets')
          .select('created_at')
          .gte('created_at', past60DaysDate.toISOString())
          .lt('created_at', past30DaysDate.toISOString());

        if (previousTicketsError) throw previousTicketsError;

        const applicationsCount = currentApplicationsData?.length || 0;
        const previousApplicationsCount = previousApplicationsData?.length || 0;
        const applicationsTrend = ((applicationsCount - previousApplicationsCount) / (previousApplicationsCount || 1)) * 1;
        const applicationsData = currentApplicationsData.map(item => new Date(item.created_at).getDate());

        const ticketsCount = currentTicketsData?.length || 0;
        const previousTicketsCount = previousTicketsData?.length || 0;
        const ticketsTrend = ((ticketsCount - previousTicketsCount) / (previousTicketsCount || 1)) * 1;
        const ticketsData = currentTicketsData.map(item => new Date(item.created_at).getDate());

        setMetrics([
          {
            title: 'Applications',
            value: `${applicationsCount}`,
            interval: 'Last 30 days',
            trend: applicationsTrend > 0 ? 'up' : applicationsTrend < 0 ? 'down' : 'neutral',
            trendValue: `${applicationsTrend > 0 ? '+' : ''}${applicationsTrend.toFixed(2)}%`,
            data: applicationsData,
          },
          {
            title: 'Tickets',
            value: `${ticketsCount}`,
            interval: 'Last 30 days',
            trend: ticketsTrend > 0 ? 'up' : ticketsTrend < 0 ? 'down' : 'neutral',
            trendValue: `${ticketsTrend > 0 ? '+' : ''}${ticketsTrend.toFixed(2)}%`,
            data: ticketsData,
          },
        ]);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    fetchMetrics();
  }, []);
  */

  return (
    <SimpleGrid cols={2} spacing="lg">
      {/*
      {metrics.map((metric) => (
        <StatCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          interval={metric.interval}
          trend={metric.trend}
          trendValue={metric.trendValue}
          data={metric.data}
        />
      ))}
      */}
    </SimpleGrid>
  );
}

export default DashboardStats;