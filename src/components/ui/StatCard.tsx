import React from 'react';
import { Card, Text, Group, Stack, Badge, Box, useMantineTheme } from '@mantine/core';
import { Sparkline } from '@mantine/charts';

export type StatCardProps = {
  title: string;
  value: string;
  interval: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  data: number[];
};

export default function StatCard({
  title,
  value,
  interval,
  trend,
  trendValue,
  data,
}: StatCardProps) {
  const theme = useMantineTheme();

  const trendColors = {
    up: theme.colors.green[6],
    down: theme.colors.red[6],
    neutral: theme.colors.gray[6],
  };

  const trendBadgeColors = {
    up: 'green',
    down: 'red',
    neutral: 'gray',
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#1A1B1E" }}
    >
      <Stack gap={1} style={{ flexGrow: 1 }}>
        <Text size="sm" c="dimmed" fw={500}>
          {title}
        </Text>

        <Group justify="space-between" align="center">
          <Text size="xl" fw={700}>
            {value}
          </Text>
          <Badge color={trendBadgeColors[trend]} size="sm" variant="light">
            {trendValue}
          </Badge>
        </Group>

        <Text size="xs" c="dimmed">
          {interval}
        </Text>

        <Box style={{ height: 50 }}>
          <Sparkline
            w={200}
            h={60}
            data={data}
            curveType="linear"
            color={trendColors[trend]}
            fillOpacity={0.6}
            strokeWidth={2}
          />
        </Box>
      </Stack>
    </Card>
  );
}
