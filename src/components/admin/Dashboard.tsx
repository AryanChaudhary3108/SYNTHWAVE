import React, { useState, useEffect } from 'react';
import { AppShell, Burger, Group, Button, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { supabase } from '../../supabase';
import { FaHome, FaUserShield } from 'react-icons/fa';
// import Applications from './Applications';
// import SupportTickets from './SupportTickets';
import AdminActions from './AdminActions';
import DashboardStats from './DashboardStats';

const Dashboard: React.FC = () => {
  const [opened, { toggle }] = useDisclosure();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState('');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const navigate = useNavigate();

  const fetchAdminRole = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
  
    if (userError) {
      console.error('Error fetching user:', userError.message);
      return;
    }
  
    if (user) {
      const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', user.id)
        .single();
  
      if (error) {
        console.error('Error fetching role:', error.message);
      } else if (data) {
        setRole(data.role);
      }
    }
  };

  useEffect(() => {
    fetchAdminRole();
  }, []);

  const allTabs = [
    { key: 'dashboard', label: 'Home', component: <DashboardStats />, icon: <FaHome /> },
    /*
    { key: 'applications', label: 'Applications', component: <Applications />, icon: <FaClipboardList /> },
    { key: 'support', label: 'Support Tickets', component: <SupportTickets />, icon: <FaLifeRing /> },
    */
    { key: 'adminactions', label: 'Admin Actions', component: <AdminActions />, roles: ['admin'], icon: <FaUserShield /> },
  ];

  const tabs = allTabs.filter((tab) => !tab.roles || tab.roles.includes(role));

  const renderContent = () => {
    const currentTab = tabs.find((tab) => tab.key === activeTab);
    return currentTab?.component || <DashboardStats />;
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header style={{ backgroundColor: '#1A1B1E' }}>
        <Group h="100%" px="md" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Group>
            {!isDesktop && <Burger opened={opened} onClick={toggle} size="sm" />}
            <Text size="xl" c="#8685ef">
              Dashboard
            </Text>
          </Group>
          <Button
            variant="light"
            color="#8685ef"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate('/')}
          >
            Back To Home
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" style={{ backgroundColor: '#1A1B1E' }}>
        {tabs.map((tab) => (
          <Group key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ cursor: 'pointer', marginBottom: '15px', alignItems: 'center' }}>
            <div style={{ fontSize: '24px' }}>{tab.icon}</div>
            <Text
              size="lg"
              style={{
                color: activeTab === tab.key ? '#8685ef' : '#fff',
                fontSize: '18px',
              }}
            >
              {tab.label}
            </Text>
          </Group>
        ))}
      </AppShell.Navbar>
      <AppShell.Main>{renderContent()}</AppShell.Main>
    </AppShell>
  );
}

export default Dashboard;