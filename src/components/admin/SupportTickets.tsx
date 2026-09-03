import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { Button, Table, Pagination, ActionIcon, FileButton} from "@mantine/core";
import { IconSend, IconUpload, IconX } from "@tabler/icons-react";
import { notifications } from '@mantine/notifications';
import { Dropzone, FileWithPath } from "@mantine/dropzone";
import './SuportTicket.css';

interface SupportTicket {
  id: number;
  title: string;
  category: string;
  status: string;
  messages: { attachments: any; sender: string; content: string }[];
  last_updated: string;
}

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replies, setReplies] = useState<{ [key: number]: string }>({});
  const [isReplyCooldown, setIsReplyCooldown] = useState<{ [ticketId: number]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const ticketsPerPage = 10;
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        notifications.show({
          title: 'Error',
          message: 'User not authenticated or error fetching user.',
          color: 'red',
        });
        return;
      }
      const { user_metadata } = userData.user;
      const fullName = user_metadata?.full_name || 'User';

      const { data, error, count } = await supabase
        .from('tickets')
        .select('id, title, category, status, messages, last_updated', { count: 'exact' })
        .order('last_updated', { ascending: false })
        .range((currentPage - 1) * ticketsPerPage, currentPage * ticketsPerPage - 1);

      if (error) {
        console.error('Error fetching support tickets:', error);
      } else {
        const enrichedTickets = (data || []).map((ticket) => ({
          ...ticket,
          messages: ticket.messages.map((message: { sender: string; }) =>
            message.sender === 'user' ? { ...message, sender: fullName } : message
          ),
        }));
        setTickets(enrichedTickets);
        setTotalTickets(count || 0);
      }
    };

    fetchTickets();

    const ticketSubscription = supabase
      .channel('tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => {
          handleRealtimeUpdates(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketSubscription);
    };
  }, [currentPage]);

  useEffect(() => {
    if (selectedTicket && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedTicket?.messages]);

  const handleRealtimeUpdates = (payload: any) => {
    const { eventType, new: newTicket, old: oldTicket } = payload;
    setTickets((currentTickets) => {
      switch (eventType) {
        case 'INSERT':
          if (
            newTicket.id >= (currentPage - 1) * ticketsPerPage &&
            newTicket.id < currentPage * ticketsPerPage
          ) {
            return [newTicket, ...currentTickets].slice(0, ticketsPerPage);
          }
          return currentTickets;
        case 'UPDATE':
          if (newTicket.messages) {
            setSelectedTicket((prevSelectedTicket) =>
              prevSelectedTicket && prevSelectedTicket.id === newTicket.id
                ? { ...prevSelectedTicket, messages: newTicket.messages }
                : prevSelectedTicket
            );
            return currentTickets.map((ticket) =>
              ticket.id === newTicket.id
                ? { ...ticket, messages: newTicket.messages, last_updated: newTicket.last_updated }
                : ticket
            );
          }
          return currentTickets.map((ticket) =>
            ticket.id === newTicket.id ? { ...ticket, ...newTicket } : ticket
          );
        case 'DELETE':
          return currentTickets.filter((ticket) => ticket.id !== oldTicket.id);
        default:
          return currentTickets;
      }
    });
  };

  const toggleTicketStatus = async (ticketId: number) => {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('status')
      .eq('id', ticketId)
      .single();

    if (error) {
      notifications.show({
        title: 'Error fetching ticket status',
        message: error.message,
        color: 'red',
      });
      return;
    }

    const newStatus = ticket.status === 'open' ? 'closed' : 'open';
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', ticketId);

    if (updateError) {
      notifications.show({
        title: 'Error updating ticket status',
        message: updateError.message,
        color: 'red',
      });
    } else {
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );

      notifications.show({
        title: `Ticket ${newStatus === 'open' ? 'Opened' : 'Closed'}`,
        message: `Ticket ID ${ticketId} has been ${newStatus === 'open' ? 'reopened' : 'closed'} successfully.`,
        color: newStatus === 'open' ? 'green' : 'blue',
      });
    }
  };

  const uploadFilesToSupabase = async (files: File[], ticketId: number) => {
    const fileUrls: string[] = [];
    for (const file of files) {
      const { data, error } = await supabase.storage
      .from("support-ticket-uploads")
      .upload(`ticket-${ticketId}/${file.name}`, file);
  
      if (!error && data) {
        fileUrls.push(data.path);
      } else {
        notifications.show({
          title: 'File Upload Error',
          message: `Failed to upload ${file.name}`,
          color: 'red',
        });
      }
    }
    return fileUrls;
  };
  
  const addAdminReply = async (ticketId: number) => {
    if (!replies[ticketId]?.trim() && uploadedFiles.length === 0) return;
  
    if (isReplyCooldown[ticketId]) {
      notifications.show({
        title: 'Cooldown',
        message: 'Please wait before replying again.',
        color: 'yellow',
      });
      return;
    }
  
    setIsReplyCooldown((prev) => ({ ...prev, [ticketId]: true }));
  
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('messages')
      .eq('id', ticketId)
      .single();
  
    if (fetchError) {
      notifications.show({
        title: 'Error fetching ticket',
        message: fetchError.message,
        color: 'red',
      });
      setIsReplyCooldown((prev) => ({ ...prev, [ticketId]: false }));
      return;
    }
  
    const fileUrls = await uploadFilesToSupabase(uploadedFiles, ticketId);
    const newReply = { sender: 'support', content: replies[ticketId], attachments: fileUrls };
    const updatedMessages = [...ticket.messages, newReply];
  
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        messages: updatedMessages,
        last_updated: new Date().toISOString(),
      })
      .eq('id', ticketId);
  
    if (updateError) {
      notifications.show({
        title: 'Error sending reply',
        message: updateError.message,
        color: 'red',
      });
    } else {
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, messages: updatedMessages, last_updated: new Date().toISOString() }
            : ticket
        )
      );
      setSelectedTicket((prevSelectedTicket) =>
        prevSelectedTicket && prevSelectedTicket.id === ticketId
          ? { ...prevSelectedTicket, messages: updatedMessages, last_updated: new Date().toISOString() }
          : prevSelectedTicket
      );
  
      setReplies({ ...replies, [ticketId]: '' });
      setUploadedFiles([]);
    }
  
    setTimeout(() => {
      setIsReplyCooldown((prev) => ({ ...prev, [ticketId]: false }));
    }, 3000);
  };
  
  const renderFilePreviews = () => (
    <div className="file-upload-container">
      {uploadedFiles.map((file, index) => (
          <ActionIcon
            color="red"
            onClick={() =>
              setUploadedFiles((prev) =>
                prev.filter((_, fileIndex) => fileIndex !== index)
              )
            }
          >
            <IconX size={20} />
          </ActionIcon>
      ))}
    </div>
  );

  const getSupabasePublicUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from("support-ticket-uploads")
      .getPublicUrl(filePath);
  
    return data?.publicUrl || "";
  };

  return selectedTicket ? (
    <div className="max-w-4xl mx-auto p-6 bg-[#1E1E2E] rounded-lg shadow-md">
      <div className="chat-header">
        <h2 className="text-2xl font-normal text-white">{selectedTicket.title}</h2>
        <button className="back-button" onClick={() => setSelectedTicket(null)}>
          Back to Tickets
        </button>
      </div>
      <div ref={chatContainerRef} className="chat-container">
        {selectedTicket.messages.map((message, index) => (
          <div
            key={index}
            className={`message-wrapper ${message.sender === 'support' ? 'admsupport-message' : 'admuser-message'}`}>
            <div className="message-content">
              <div className="message-sender">
                {message.sender === 'support' ? 'Support' : message.sender}
              </div>
              <p>{message.content}</p>
              {message.attachments?.length > 0 && (
                <div className="attachments">
                  <p className="attachment-label">Attachments:</p>
                  {message.attachments.map((attachment: string, i: React.Key | null | undefined) => (
                    <a
                      key={i}
                      href={getSupabasePublicUrl(attachment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="attachment-link">
                      {attachment.split('/').pop()}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="reply-section">
        <textarea
          placeholder="Type your reply..."
          value={replies[selectedTicket.id] || ''}
          onChange={(e) =>
            setReplies({ ...replies, [selectedTicket.id]: e.target.value })
          }
          className="w-2/3 h-10 mx-auto rounded-md bg-[#191923] text-white resize-none outline-none focus:ring-0"> 
        </textarea>
        <ActionIcon
          variant="default"
          size="xl"
          onClick={() => addAdminReply(selectedTicket.id)}
          disabled={
            !replies[selectedTicket.id]?.trim() ||
            isReplyCooldown[selectedTicket.id]
          }
          style={{
            color: "#8685ef",
            marginTop: "1rem",
          }}>
          <IconSend size={20} />
        </ActionIcon>
        <div className="file-button-container">
          <FileButton
            onChange={(file) => file && setUploadedFiles((prev) => [...prev, file])}
            accept="*">
            {(props) => (
              <Button variant="default" {...props}>
                <IconUpload size={20} />
              </Button>
            )}
          </FileButton>
          {renderFilePreviews()}
        </div>
      </div>
    </div>
  ) : (
    <div className="my-6">
      <Table striped highlightOnHover>
        <thead className="text-white font-normal">
          <tr>
            <th>Ticket ID</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)}>
              <td>{`TICKET-${ticket.id}`}</td>
              <td>{ticket.title}</td>
              <td>{ticket.category}</td>
              <td
                style={{
                  color: ticket.status === 'open' ? '#52db72' : '#ff5555',
                }}
              >
                {ticket.status.toUpperCase()}
              </td>
              <td>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTicketStatus(ticket.id);
                  }}
                  color={ticket.status === 'open' ? 'red' : 'green'}
                >
                  {ticket.status === 'closed' ? 'OPEN' : 'CLOSE'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="pagination flex justify-center mt-4">
        <Pagination
          value={currentPage}
          onChange={setCurrentPage}
          total={Math.ceil(totalTickets / ticketsPerPage)}
          size="sm"
          radius="md"
          color="#8685ef"
          withControls
        />
      </div>
    </div>
  );
}


export default SupportTickets;