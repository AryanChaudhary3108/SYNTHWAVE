import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Table, Text, Group, Stack, Select, Textarea, Title, Modal, TextInput, ActionIcon, FileButton, } from "@mantine/core";
import { Dropzone, FileWithPath } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { IconChevronDown, IconChevronRight, IconSend, IconUpload, IconX } from "@tabler/icons-react";
import { supabase } from "../../supabase";
import "./Support.css";

interface Ticket {
  id: number;
  title: string;
  category: string;
  status: "open" | "closed";
  messages: { attachments: any; sender: string; content: string }[];
  last_updated: string;
  user_id: string;
  attachments?: string[];
}

const categories = [
  "General Inquiry",
  "Technical Support",
  "Billing",
  "Feature Request",
  "Bug Report",
];

const SupportTicket: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState<string | null>(null);
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [replies, setReplies] = useState<{ [key: number]: string }>({});
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPath[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [isCreateTicketCooldown, setIsCreateTicketCooldown] = useState(false);
  const [isReplyCooldown, setIsReplyCooldown] = useState<{ [ticketId: number]: boolean }>({});
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
    const ticketSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        (payload) => handleRealtimeUpdate(payload)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ticketSubscription);
    };
  }, []);

  const formatToUserTimezone = (dateString: string | number | Date): string => {
    try {
      if (!dateString) {
        return "Invalid Date";
      }
  
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
  
      return new Intl.DateTimeFormat(undefined, options).format(new Date(dateString));
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const fetchTickets = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      notifications.show({
        title: "Error",
        message: "User not authenticated or error fetching user.",
        color: "red",
      });
      return;
    }

    const fullName = userData.user.user_metadata?.full_name || "User";

    const { data, error } = await supabase
      .from("tickets")
      .select("id, title, category, status, messages, last_updated, user_id, attachments")
      .eq("user_id", userData.user.id)
      .order("last_updated", { ascending: false });

    if (error) {
      notifications.show({
        title: "Error fetching tickets",
        message: error.message,
        color: "red",
      });
    } else {
      const enrichedTickets = (data || []).map((ticket) => ({
        ...ticket,
        last_updated: formatToUserTimezone(ticket.last_updated),
        messages: (ticket.messages || []).map((message: { sender: string; content: string }) =>
          message.sender === "user"
            ? { ...message, sender: fullName }
            : message
        ),
      }));

      setTickets(enrichedTickets);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newTicket, old: oldTicket } = payload;
  
    setTickets((currentTickets) => {
      switch (eventType) {
        case "INSERT":
          return [
            {
              ...newTicket,
              last_updated: formatToUserTimezone(newTicket.last_updated),
            },
            ...currentTickets,
          ];
        case "UPDATE":
          return currentTickets.map((ticket) =>
            ticket.id === newTicket.id
              ? {
                  ...newTicket,
                  last_updated: formatToUserTimezone(newTicket.last_updated), // Format here
                }
              : ticket
          );
        case "DELETE":
          return currentTickets.filter((ticket) => ticket.id !== oldTicket.id);
        default:
          return currentTickets;
      }
    });
  };

  const closeNewTicketModal = () => {
    setIsNewTicketModalOpen(false);
    setNewTicketTitle("");
    setNewTicketCategory(null);
    setNewTicketMessage("");
  };

  useEffect(() => {
    if (expandedTicketId !== null) {
      const expandedTicket = tickets.find(
        (ticket) => ticket.id === expandedTicketId
      );
      if (expandedTicket && messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    }
  }, [tickets, expandedTicketId]);

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
          title: "Error",
          message: `Failed to upload file: ${file.name}`,
          color: "red",
        });
      }
    }
    return fileUrls;
  };

  const createTicket = async () => {
    if (newTicketTitle.length > 50) {
      notifications.show({ title: "Error", message: "Title can't exceed 50 characters", color: "red" });
      return;
    }

    if (!newTicketCategory) {
      notifications.show({ title: "Error", message: "Please select a category.", color: "red" });
      return;
    }

    if (!newTicketMessage.trim()) {
      notifications.show({ title: "Error", message: "Please provide a detailed description.", color: "red" });
      return;
    }

    if (isCreateTicketCooldown) {
      notifications.show({ title: "Cooldown", message: "Please wait before creating another ticket.", color: "yellow" });
      return;
    }
  
    setIsCreateTicketCooldown(true);
  
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      notifications.show({
        title: "Error",
        message: "User not authenticated.",
        color: "red",
      });
      setIsCreateTicketCooldown(false);
      return;
    }
  
    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .insert([
        {
          title: newTicketTitle,
          category: newTicketCategory,
          status: "open",
          messages: [
            {
              sender: userData.user.user_metadata?.full_name || "User",
              content: newTicketMessage,
            },
          ],
          user_id: userData.user.id,
          attachments: [],
        },
      ])
      .select("*")
      .single();
  
    if (ticketError || !ticketData) {
      notifications.show({
        title: "Error",
        message: ticketError?.message || "Failed to create ticket.",
        color: "red",
      });
      setIsCreateTicketCooldown(false);
      return;
    }
  
    const fileUrls = await uploadFilesToSupabase(uploadedFiles, ticketData.id);
  
    if (fileUrls.length > 0) {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ attachments: fileUrls })
        .eq("id", ticketData.id);
  
      if (updateError) {
        notifications.show({
          title: "Error",
          message: updateError.message,
          color: "red",
        });
      }
    }
  
    notifications.show({
      title: "Success",
      message: "Ticket created successfully!",
      color: "green",
    });
  
    setIsNewTicketModalOpen(false);
    setUploadedFiles([]);
    fetchTickets();
    setTimeout(() => setIsCreateTicketCooldown(false), 5000);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const addReplyWithFiles = async (ticketId: number) => {
    if (!replies[ticketId]?.trim() && uploadedFiles.length === 0) {
      notifications.show({
        title: "Error",
        message: "Please provide a message or upload files before replying.",
        color: "red",
      });
      return;
    }
  
    if (isReplyCooldown[ticketId]) {
      notifications.show({
        title: "Cooldown",
        message: "Please wait before replying again.",
        color: "yellow",
      });
      return;
    }
  
    setIsReplyCooldown((prev) => ({ ...prev, [ticketId]: true }));
  
    const { data: userData, error: userError } = await supabase.auth.getUser();
  
    if (userError || !userData?.user) {
      notifications.show({
        title: "Error",
        message: "User not authenticated.",
        color: "red",
      });
      setIsReplyCooldown((prev) => ({ ...prev, [ticketId]: false }));
      return;
    }
  
    const fullName = userData.user.user_metadata?.full_name || "User";
  
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("messages")
      .eq("id", ticketId)
      .single();
  
    if (fetchError) {
      notifications.show({
        title: "Error fetching ticket",
        message: fetchError.message,
        color: "red",
      });
      setIsReplyCooldown((prev) => ({ ...prev, [ticketId]: false }));
      return;
    }
  
    const fileUrls = await uploadFilesToSupabase(uploadedFiles, ticketId);
  
    const newReply = {
      sender: fullName,
      content: replies[ticketId],
      attachments: fileUrls,
    };
  
    const updatedMessages = [...ticket.messages, newReply];
  
    const currentDateTime = new Date().toISOString();
  
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ messages: updatedMessages, last_updated: currentDateTime })
      .eq("id", ticketId);
  
    if (updateError) {
      notifications.show({
        title: "Error sending reply",
        message: updateError.message,
        color: "red",
      });
    } else {
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                messages: updatedMessages,
                last_updated: formatToUserTimezone(currentDateTime),
              }
            : ticket
        )
      );
      setReplies({ ...replies, [ticketId]: "" });
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

  const toggleTicketExpansion = (ticketId: number) => {
    if (tickets.find((ticket) => ticket.id === ticketId)?.status === "closed") {
      return;
    }
    setExpandedTicketId(ticketId === expandedTicketId ? null : ticketId);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "General Inquiry":
        return "blue";
      case "Technical Support":
        return "green";
      case "Billing":
        return "yellow";
      case "Feature Request":
        return "grape";
      case "Bug Report":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <Stack className="container">
      <Group className="support-header">
        <Title order={2} className="support-title">
          SUPPORT TICKETS
        </Title>
        <Group className="button-group">
          <Button
            variant="default"
            onClick={() => setIsNewTicketModalOpen(true)}
          >
            New Ticket
          </Button>
          <Button variant="default" onClick={() => navigate("/")}>
            Back
          </Button>
        </Group>
      </Group>
      <Table className="table">
        <thead className="text-white font-normal">
          <tr>
            <th>Category</th>
            <th>Title</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => toggleTicketExpansion(ticket.id)}
                className={expandedTicketId === ticket.id ? "expanded" : ""}
                style={{ cursor: "pointer" }}
              >
                <td>
                  {expandedTicketId === ticket.id ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                  <Text c={getCategoryColor(ticket.category)}>
                    {ticket.category}
                  </Text>
                </td>
                <td>{ticket.title}</td>
                <td className={`status-${ticket.status}`}>{ticket.status}</td>
                <td>
                  {ticket.last_updated
                    ? formatToUserTimezone(ticket.last_updated)
                    : "N/A"}
                </td>
              </tr>
            ))
          ) : (
            <tr className="no-tickets-row">
              <td colSpan={4} className="no-tickets">
                <Text c="dimmed">No tickets found</Text>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      {expandedTicketId !== null && (
        <div className="expanded-ticket-details">
          {tickets
            .filter((ticket) => ticket.id === expandedTicketId)
            .map((ticket) => (
              <div key={ticket.id}>
                <Title
                  order={3}
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "normal",
                    color: "white",
                    margin: "0.5rem 0",
                  }}
                >
                  {ticket.title}
                </Title>
                <div ref={messagesContainerRef} className="messages">
                  {ticket.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`message-wrapper ${message.sender === "support"
                            ? "support-message"
                            : "user-message"
                          }`}
                      >
                        <div className="message-content">
                          <div className="message-sender">
                            {message.sender === "support"
                              ? "Support"
                              : message.sender}
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
                                  className="attachment-link"
                                >
                                  {attachment.split('/').pop()}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                <div className="reply-group">
                  <div className="textarea-container">
                    <textarea
                      placeholder="Type your reply..."
                      value={replies[ticket.id] || ""}
                      onChange={(event) =>
                        setReplies({
                          ...replies,
                          [ticket.id]: event.currentTarget.value,
                        })
                      }
                      className="w-2/3 h-10 mx-auto rounded-md bg-[#191923] text-white resize-none outline-none focus:ring-0">
                      </textarea>
                    <ActionIcon
                      variant="default"
                      size="xl"
                      onClick={() => addReplyWithFiles(ticket.id)}
                      disabled={!replies[ticket.id]?.trim() && uploadedFiles.length === 0}
                      style={{
                        color: "#8685ef",
                        marginTop: "-1rem",
                      }}>
                      <IconSend size={20} />
                    </ActionIcon>
                  </div>
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
            ))}
        </div>
      )}
      <Modal
        opened={isNewTicketModalOpen}
        onClose={closeNewTicketModal}
        title={
          <Text size="xl" fw={700} className="modal-title">
            NEW SUPPORT TICKET
          </Text>
        }
        size="lg"
      >
        <Stack>
          <TextInput
            placeholder="Title"
            value={newTicketTitle}
            onChange={(event) => setNewTicketTitle(event.currentTarget.value)}
            className="text-input"
          />
          <Select
            placeholder="Category"
            data={categories}
            value={newTicketCategory}
            onChange={setNewTicketCategory}
            className="select-input"
          />
          <Textarea
            placeholder="Describe your issue in detail"
            value={newTicketMessage}
            onChange={(event) => setNewTicketMessage(event.currentTarget.value)}
            className="text-input"
          />
          <Dropzone
            onDrop={(files: any) =>
              setUploadedFiles((prev) => [...prev, ...files])
            }
            maxSize={8 * 1024 ** 2}
          >
            <Group
              align="center"
              justify="center"
              style={{ flexDirection: "column" }}
            >
              <IconUpload size={50} />
              <Text>Drag files here or click to upload</Text>
            </Group>
          </Dropzone>
          {uploadedFiles.map((file, index) => (
            <Text key={index}>{file.path}</Text>
          ))}
          <Group>
            <Button
              variant="light"
              color="red"
              onClick={closeNewTicketModal}
              className="cancel-button"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={createTicket}
              disabled={isCreateTicketCooldown}
              className="submit-button"
            >
              Submit
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default SupportTicket;