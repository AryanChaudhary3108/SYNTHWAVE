import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Pagination } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import './Application.css';

interface Application {
  id: number;
  real_name: string;
  discord_user_id: string;
  age: number;
  microphone: string;
  other_servers: string;
  memorable_scenario: string;
  character_name: string;
  backstory: string;
  goal: string;
  fail_rp: string;
  metagaming: string;
  powergaming: string;
  scenario1: string;
  scenario2: string;
  scenario3: string;
  status: string;
  created_at: string;
}
const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const applicationsPerPage = 10;

  useEffect(() => {
    fetchApplications();
    fetchUserRole();
  }, [currentPage]);

  const fetchUserRole = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return;
    }

    const userId = userData.user.id;
    const { data: roleData, error: roleError } = await supabase
      .from('admins')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
    } else {
      setUserRole(roleData.role);
    }
  };

  const fetchApplications = async () => {
    setLoadingApplications(true);
    const { data, error, count } = await supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .range((currentPage - 1) * applicationsPerPage, currentPage * applicationsPerPage - 1);

    if (error) {
      console.error('Error fetching applications:', error);
    } else {
      setApplications((data || []) as Application[]);
      setTotalApplications(count || 0);
    }
    setLoadingApplications(false);
  };

  const handleAccept = async (id: number) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) {
        throw error;
      }

      notifications.show({
        title: 'Success',
        message: 'Application accepted successfully!',
        color: 'green',
      });
      fetchApplications();
    } catch (error) {
      console.error('Error accepting application:', error);
      notifications.show({
        title: 'Error',
        message: 'There was an error accepting the application.',
        color: 'red',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) {
        throw error;
      }

      notifications.show({
        title: 'Success',
        message: 'Application rejected successfully!',
        color: 'green',
      });
      fetchApplications();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'There was an error rejecting the application.',
        color: 'red',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
    setProcessing(true);
    try {
      const { error } = await supabase.from('applications').delete().eq('id', id);

      if (error) {
        throw error;
      }

      notifications.show({
        title: 'Success',
        message: 'Application deleted successfully!',
        color: 'green',
      });
      fetchApplications();
      setSelectedApplication(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'There was an error deleting the application.',
        color: 'red',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.trim()) {
      const filteredApplications = applications.filter((application) =>
        application.id.toString().includes(value.trim())
      );
      setApplications(filteredApplications);
    } else {
      fetchApplications();
    }
  };

  const toPascalCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/(?:^|\s|_)(\w)/g, (_, c) => c.toUpperCase());
  };

  return (
    <div>
      {selectedApplication ? (
        <div className="application-details-container w-full md:w-2/3 mx-auto p-6 bg-gray-800 text-white rounded shadow-md">
          <button className="back-button" onClick={() => setSelectedApplication(null)}>
            Back to Applications
          </button>
          <h2 className="text-xl font-bold text-center mb-4">Application Details</h2>
          <div className="details-grid">
            <p><strong>Real Name:</strong> {selectedApplication.real_name}</p>
            <p><strong>Discord UserID:</strong> {selectedApplication.discord_user_id}</p>
            <p><strong>Age:</strong> {selectedApplication.age}</p>
            <p><strong>Microphone:</strong> {selectedApplication.microphone}</p>
            <p><strong>Other Servers:</strong> {selectedApplication.other_servers}</p>
            <p><strong>Memorable Scenario:</strong> {selectedApplication.memorable_scenario}</p>
            <p><strong>Character Name:</strong> {selectedApplication.character_name}</p>
            <p><strong>Backstory:</strong> {selectedApplication.backstory}</p>
            <p><strong>Goal:</strong> {selectedApplication.goal}</p>
            <p><strong>Fail RP:</strong> {selectedApplication.fail_rp}</p>
            <p><strong>Metagaming:</strong> {selectedApplication.metagaming}</p>
            <p><strong>Powergaming:</strong> {selectedApplication.powergaming}</p>
            <p><strong>Scenario 1:</strong> {selectedApplication.scenario1}</p>
            <p><strong>Scenario 2:</strong> {selectedApplication.scenario2}</p>
            <p><strong>Scenario 3:</strong> {selectedApplication.scenario3}</p>
          </div>
          <div className="action-buttons mt-4 flex justify-between">
            <button
              className="bg-green-500 text-white py-2 px-4 rounded"
              onClick={() => handleAccept(selectedApplication.id)}
              disabled={processing}
            >
              Accept
            </button>
            <button
              className="bg-yellow-500 text-white py-2 px-4 rounded"
              onClick={() => handleReject(selectedApplication.id)}
              disabled={processing}
            >
              Reject
            </button>
            <button
              className="bg-red-500 text-white py-2 px-4 rounded"
              onClick={() => handleDelete(selectedApplication.id)}
              disabled={processing}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="applications-list-container">
            <div className="search-container mb-4">
            <input
              type="text"
              placeholder="Search by Application ID"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input p-2 border border-gray-300 rounded w-full"
            />
          </div>
          <table className="min-w-max w-full table-auto my-6">
            <thead className="text-white font-normal">
              <tr>
                <th>Application ID</th>
                <th>Real Name</th>
                <th>Discord UserID</th>
                <th>Age</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              {applications.map((application) => (
                <tr key={application.id} onClick={() => setSelectedApplication(application)}>
                  <td>{application.id}</td>
                  <td>{application.real_name}</td>
                  <td>{application.discord_user_id}</td>
                  <td>{application.age}</td>
                  <td>{application.created_at ? new Date(application.created_at).toLocaleString() : 'N/A'}</td>
                  <td>
                    <span
                      style={{
                        color:
                          application.status.toLowerCase() === 'approved'
                            ? '#52db72'
                            : application.status.toLowerCase() === 'rejected'
                              ? '#ff5555'
                              : '#ffffff',
                        fontSize: '0.875rem',
                      }}
                    >
                      {toPascalCase(application.status || 'Pending')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination flex justify-center mt-4">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={Math.ceil(totalApplications / applicationsPerPage)}
              size="sm"
              radius="md"
              color="#8685ef"
              withControls
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;