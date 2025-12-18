'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Loader2,
  Car,
  Building2,
  ArrowRight,
  Send,
  Trash2,
  User,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice, formatDate } from '@/lib/utils';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { useSocket } from '@/hooks/use-socket';

export default function UserMessagesPage() {
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleInquiryReply = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'inquiries'] });
      queryClient.refetchQueries({ queryKey: ['user', 'inquiries'] });
      if (selectedInquiry?.id === data.inquiry?.id) {
        setSelectedInquiry(data.inquiry);
      }
    };

    const handleMessageRead = (data: any) => {
      if (data.readBy === 'dealer' && selectedInquiry?.id === data.inquiryId) {
        setSelectedInquiry((prev: any) => prev ? { ...prev, dealerReadAt: new Date().toISOString() } : prev);
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'inquiries'] });
      queryClient.refetchQueries({ queryKey: ['user', 'inquiries'] });
    };

    socket.on('inquiry_reply', handleInquiryReply);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('inquiry_reply', handleInquiryReply);
      socket.off('message_read', handleMessageRead);
    };
  }, [socket, queryClient, selectedInquiry?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedInquiry?.message, selectedInquiry?.reply]);

  const { data: inquiriesData, isLoading, error } = useQuery({
    queryKey: ['user', 'inquiries', statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/inquiries?status=${statusFilter === 'all' ? '' : statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch inquiries:', response.status, errorText);
        throw new Error(`Failed to fetch inquiries: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });

  const inquiries = inquiriesData?.data || [];
  
  // Parse messages from inquiry.message (split by timestamp separators)
  const parseMessages = (messageText: string) => {
    if (!messageText) return [];
    
    const messages: any[] = [];
    
    // Pattern to match: "--- Dec 13, 2025, 4:32:13 AM ---" or "--- Dec 13, 2025, 4:32 AM ---"
    // The separator appears as: \n\n--- timestamp ---\n
    const timestampPattern = /---\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}(?::\d{2})?\s+[AP]M)\s*---/g;
    
    // Find all timestamp positions
    const timestampMatches: { index: number; timestamp: string; fullMatch: string }[] = [];
    let match;
    while ((match = timestampPattern.exec(messageText)) !== null) {
      timestampMatches.push({
        index: match.index,
        timestamp: match[1],
        fullMatch: match[0],
      });
    }
    
    // If no timestamps found, return the whole message
    if (timestampMatches.length === 0) {
      return [{
        id: 0,
        text: messageText.trim(),
        timestamp: null,
      }];
    }
    
    // Extract first message (before first timestamp)
    const firstTimestampIndex = timestampMatches[0].index;
    const firstMessage = messageText.substring(0, firstTimestampIndex).trim();
    if (firstMessage) {
      messages.push({
        id: messages.length,
        text: firstMessage,
        timestamp: null,
      });
    }
    
    // Extract messages after each timestamp
    for (let i = 0; i < timestampMatches.length; i++) {
      const current = timestampMatches[i];
      const nextIndex = i + 1 < timestampMatches.length 
        ? timestampMatches[i + 1].index 
        : messageText.length;
      
      // Message starts after the timestamp separator
      const messageStart = current.index + current.fullMatch.length;
      const messageText2 = messageText.substring(messageStart, nextIndex).trim();
      
      if (messageText2) {
        messages.push({
          id: messages.length,
          text: messageText2,
          timestamp: current.timestamp,
        });
      }
    }
    
    return messages;
  };
  
  // Update selected inquiry when data changes
  useEffect(() => {
    if (selectedInquiry) {
      const updatedInquiry = inquiries.find((i: any) => i.id === selectedInquiry.id);
      if (updatedInquiry) {
        setSelectedInquiry(updatedInquiry);
      }
    }
  }, [inquiries, selectedInquiry?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ listingId, dealerId, message }: { listingId: string; dealerId: string; message: string }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      
      // Get user info from API instead of localStorage
      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }
      
      const user = await userResponse.json();
      
      if (!user.email) {
        throw new Error('User email is required. Please update your profile.');
      }
      
      // Backend will handle finding/updating existing inquiry
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/listings/inquiry`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            listingId,
            dealerId,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
            email: user.email,
            message,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send message');
      }
      
      const result = await response.json();
      
      // If backend returned the inquiry, use it
      if (result.inquiry) {
        setSelectedInquiry(result.inquiry);
        return result.inquiry;
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'inquiries', 'unread'] });
      setNewMessage('');
      toast.success('Message sent successfully!');
      
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['user', 'inquiries'] });
      }, 100);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/inquiries/${inquiryId}/archive`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete conversation');
      }
      
      return response.json();
    },
    onSuccess: (_, inquiryId) => {
      // Remove from cache immediately
      queryClient.setQueryData(['user', 'inquiries', statusFilter], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((inq: any) => inq.id !== inquiryId),
        };
      });
      
      // Invalidate all inquiry queries
      queryClient.invalidateQueries({ queryKey: ['user', 'inquiries'] });
      
      // Clear selected inquiry if it was deleted
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null);
      }
      
      toast.success('Conversation deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete conversation');
    },
  });

  const handleSendMessage = async () => {
    if (!selectedInquiry || !newMessage.trim()) return;
    
    setIsSendingMessage(true);
    try {
      await sendMessageMutation.mutateAsync({
        listingId: selectedInquiry.listingId,
        dealerId: selectedInquiry.dealerId,
        message: newMessage.trim(),
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me/inquiries/${inquiryId}/read`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
  });

  const handleSelectInquiry = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    if (inquiry.reply && !inquiry.userReadAt) {
      markAsReadMutation.mutate(inquiry.id);
    }
  };

  // Log error for debugging
  if (error) {
    console.error('Inquiries query error:', error);
  }

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    // Don't show user-archived inquiries unless filter is set to ARCHIVED
    // Check both new userArchived flag and old ARCHIVED status for backward compatibility
    const isArchived = inquiry.userArchived === true || inquiry.status === 'ARCHIVED';
    if (statusFilter !== 'ARCHIVED' && isArchived) {
      return false;
    }
    if (statusFilter === 'ARCHIVED' && !isArchived) {
      return false;
    }
    
    const matchesSearch =
      inquiry.dealer?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = inquiries.filter((i: any) => i.status === 'NEW').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Your conversations with dealers
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inquiries List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="READ">Read</SelectItem>
                    <SelectItem value="REPLIED">Replied</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Send a message to a dealer to start a conversation</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredInquiries.map((inquiry: any) => (
                    <div key={inquiry.id} className="relative group">
                      <button
                        onClick={() => handleSelectInquiry(inquiry)}
                        className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          selectedInquiry?.id === inquiry.id ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {inquiry.dealer?.logo ? (
                              <Image
                                src={inquiry.dealer.logo}
                                alt={inquiry.dealer.businessName}
                                width={48}
                                height={48}
                                className="rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm truncate">
                                {inquiry.dealer?.businessName || 'Dealer'}
                              </p>
                              {inquiry.status === 'NEW' && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {inquiry.listing?.year} {inquiry.listing?.make} {inquiry.listing?.model}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(inquiry.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this conversation?')) {
                            deleteInquiryMutation.mutate(inquiry.id);
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedInquiry ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {selectedInquiry.dealer?.logo ? (
                      <Image
                        src={selectedInquiry.dealer.logo}
                        alt={selectedInquiry.dealer.businessName}
                        width={64}
                        height={64}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle>{selectedInquiry.dealer?.businessName || 'Dealer'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedInquiry.dealer?.city}, {selectedInquiry.dealer?.province}
                      </p>
                    </div>
                  </div>
                  <Badge variant={selectedInquiry.status === 'REPLIED' ? 'default' : 'secondary'}>
                    {selectedInquiry.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vehicle Info */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-4">
                    {selectedInquiry.listing?.media?.[0]?.url ? (
                      <Image
                        src={selectedInquiry.listing.media[0].url}
                        alt={selectedInquiry.listing.title}
                        width={120}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-20 w-32 rounded-lg bg-slate-200 flex items-center justify-center">
                        <Car className="h-8 w-8 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {selectedInquiry.listing?.year} {selectedInquiry.listing?.make} {selectedInquiry.listing?.model}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedInquiry.listing?.title}
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">
                        {formatPrice(selectedInquiry.listing?.price)}
                      </p>
                      <Link
                        href={`/vehicles/${selectedInquiry.listing?.slug}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        View Listing <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Chat Messages Container */}
                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  {/* Combine messages chronologically */}
                  {(() => {
                    const userMessages = parseMessages(selectedInquiry.message || '');
                    const dealerReplies = selectedInquiry.reply ? parseMessages(selectedInquiry.reply) : [];
                    
                    // Parse timestamps and combine all messages with their timestamps
                    const parseTimestamp = (timestampStr: string | null): number => {
                      if (!timestampStr) return 0;
                      try {
                        // Format: "Dec 13, 2025, 4:25:52 AM" or "Dec 13, 2025, 4:25 AM"
                        // Try parsing directly first
                        let normalized = timestampStr.trim();
                        let date = new Date(normalized);
                        let time = date.getTime();
                        
                        // If parsing failed, try to fix the format
                        if (isNaN(time) || time === 0) {
                          // Try adding seconds if missing: "Dec 13, 2025, 4:25 AM" -> "Dec 13, 2025, 4:25:00 AM"
                          normalized = normalized.replace(/(\d{1,2}:\d{2})\s+([AP]M)/, '$1:00 $2');
                          date = new Date(normalized);
                          time = date.getTime();
                        }
                        
                        if (isNaN(time) || time === 0) {
                          return 0;
                        }
                        return time;
                      } catch {
                        return 0;
                      }
                    };
                    
                    // Combine all messages chronologically
                    const allMessages: any[] = [];
                    const createdAtTime = new Date(selectedInquiry.createdAt).getTime();
                    
                    // Add user messages
                    userMessages.forEach((msg: any, idx: number) => {
                      let msgTime = parseTimestamp(msg.timestamp);
                      if (msgTime === 0) {
                        // First user message - use createdAt
                        msgTime = createdAtTime + (idx * 100);
                      }
                      
                      allMessages.push({
                        ...msg,
                        type: 'user',
                        timestampValue: msgTime,
                        originalIndex: idx,
                      });
                    });
                    
                    // Add dealer replies
                    dealerReplies.forEach((reply: any, idx: number) => {
                      let replyTime = parseTimestamp(reply.timestamp);
                      if (replyTime === 0) {
                        // First dealer reply - use createdAt + 1 second (after first user message)
                        // NOT repliedAt because repliedAt is updated to the LAST reply time
                        replyTime = createdAtTime + 1000 + (idx * 100);
                      }
                      
                      allMessages.push({
                        ...reply,
                        type: 'dealer',
                        timestampValue: replyTime,
                        originalIndex: idx,
                      });
                    });
                    
                    // Sort by timestamp only
                    allMessages.sort((a, b) => a.timestampValue - b.timestampValue);
                    
                    if (allMessages.length === 0) {
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-center py-8"
                        >
                          <div className="text-center">
                            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              No messages yet
                            </p>
                          </div>
                        </motion.div>
                      );
                    }
                    
                    const lastUserMsgIdx = allMessages.map((m, i) => m.type === 'user' ? i : -1).filter(i => i >= 0).pop();
                    
                    return allMessages.map((msg: any, idx: number) => {
                      if (msg.type === 'user') {
                        const isLastUserMsg = idx === lastUserMsgIdx;
                        const isRead = !!selectedInquiry.dealerReadAt;
                        return (
                          <motion.div
                            key={`user-${msg.id}-${idx}`}
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="flex justify-end"
                          >
                            <div className="flex items-end gap-2 max-w-[75%]">
                              <div className="flex flex-col items-end">
                                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md">
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                </div>
                                <div className="flex items-center gap-1 mt-1 px-2">
                                  {msg.timestamp && (
                                    <span className="text-xs text-muted-foreground">
                                      {msg.timestamp}
                                    </span>
                                  )}
                                  {isLastUserMsg && (
                                    isRead ? (
                                      <CheckCheck className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <Check className="h-4 w-4 text-muted-foreground" />
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          </motion.div>
                        );
                      } else {
                        return (
                          <motion.div
                            key={`dealer-${msg.id}-${idx}`}
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="flex justify-start"
                          >
                            <div className="flex items-end gap-2 max-w-[75%]">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col items-start">
                                <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                </div>
                                {msg.timestamp && (
                                  <span className="text-xs text-muted-foreground mt-1 px-2">
                                    {msg.timestamp}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      }
                    });
                  })()}

                  {/* Typing Indicator (when sending) */}
                  {isSendingMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-end"
                    >
                      <div className="flex items-end gap-2 max-w-[75%]">
                        <div className="bg-primary/50 text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <p className="text-sm">Sending...</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Send New Message - WhatsApp Style */}
                <div className="sticky bottom-0 bg-background border-t pt-4 mt-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newMessage.trim() && !isSendingMessage) {
                              handleSendMessage();
                            }
                          }
                        }}
                        rows={1}
                        className="resize-none min-h-[44px] max-h-32 pr-12 rounded-2xl"
                      />
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSendingMessage}
                        size="icon"
                        className="h-11 w-11 rounded-full"
                      >
                        {isSendingMessage ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedInquiry.dealer?.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${selectedInquiry.dealer.contactPhone}`}
                          className="text-primary hover:underline"
                        >
                          {selectedInquiry.dealer.contactPhone}
                        </a>
                      </div>
                    )}
                    {selectedInquiry.dealer?.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${selectedInquiry.dealer.contactEmail}`}
                          className="text-primary hover:underline"
                        >
                          {selectedInquiry.dealer.contactEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a message from the list to view the conversation
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

