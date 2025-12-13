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
  Reply,
  Archive,
  Loader2,
  Car,
  User,
  Trash2,
  Building2,
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

export default function DealerMessagesPage() {
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['dealer', 'inquiries', statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/inquiries?status=${statusFilter === 'all' ? '' : statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    refetchOnWindowFocus: true,
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedInquiry?.message, selectedInquiry?.reply]);
  
  // Update selected inquiry when data changes
  useEffect(() => {
    if (selectedInquiry && inquiries.length > 0) {
      const updatedInquiry = inquiries.find((i: any) => i.id === selectedInquiry.id);
      if (updatedInquiry) {
        setSelectedInquiry(updatedInquiry);
      }
    }
  }, [inquiries, selectedInquiry?.id]);

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    // Don't show dealer-archived inquiries unless filter is set to ARCHIVED
    // Check both new dealerArchived flag and old ARCHIVED status for backward compatibility
    const isArchived = inquiry.dealerArchived === true || inquiry.status === 'ARCHIVED';
    if (statusFilter !== 'ARCHIVED' && statusFilter !== 'all' && isArchived) {
      return false;
    }
    if (statusFilter === 'all' && isArchived) {
      return false; // Don't show archived in "all" view
    }
    if (statusFilter === 'ARCHIVED' && !isArchived) {
      return false;
    }
    
    const matchesSearch =
      inquiry.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ inquiryId, status, reply }: { inquiryId: string; status: string; reply?: string }) => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/inquiries/${inquiryId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, reply }),
        }
      );
      if (!response.ok) throw new Error('Failed to update inquiry');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // If archiving (deleting), remove from cache immediately
      if (variables.status === 'ARCHIVED') {
        queryClient.setQueryData(['dealer', 'inquiries', statusFilter], (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((inq: any) => inq.id !== variables.inquiryId),
          };
        });
        
        // Clear selected inquiry if it was deleted
        if (selectedInquiry?.id === variables.inquiryId) {
          setSelectedInquiry(null);
        }
      } else {
        // Update selected inquiry immediately for other status changes
        if (selectedInquiry && selectedInquiry.id === variables.inquiryId) {
          // Use the reply from the response (which includes appended messages)
          setSelectedInquiry({
            ...selectedInquiry,
            reply: data.reply || selectedInquiry.reply,
            status: variables.status,
            repliedAt: data.repliedAt || new Date().toISOString(),
          });
        }
      }
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['dealer', 'inquiries'] });
      
      if (variables.status === 'ARCHIVED') {
        toast.success('Conversation deleted');
      } else {
        toast.success('Reply sent successfully!');
        setReplyText('');
        setIsReplying(false);
      }
      
      // Refetch immediately to get updated data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['dealer', 'inquiries'] });
      }, 300);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update inquiry');
      setIsReplying(false);
    },
  });

  const handleReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;
    setIsReplying(true);
    await updateInquiryMutation.mutateAsync({
      inquiryId: selectedInquiry.id,
      status: 'REPLIED',
      reply: replyText,
    });
  };

  const handleMarkAsRead = async (inquiryId: string) => {
    await updateInquiryMutation.mutateAsync({
      inquiryId,
      status: 'READ',
    });
  };

  const handleArchive = async (inquiryId: string) => {
    await updateInquiryMutation.mutateAsync({
      inquiryId,
      status: 'ARCHIVED',
    });
  };

  const unreadCount = inquiries.filter((i: any) => i.status === 'NEW').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Manage inquiries and messages from potential buyers
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
              <CardTitle className="text-lg">Inquiries</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No inquiries found</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredInquiries.map((inquiry: any) => (
                    <div key={inquiry.id} className="relative group">
                      <button
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          if (inquiry.status === 'NEW') {
                            handleMarkAsRead(inquiry.id);
                          }
                        }}
                        className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          selectedInquiry?.id === inquiry.id ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                        } ${inquiry.status === 'NEW' ? 'border-l-4 border-primary' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative h-12 w-16 rounded-lg overflow-hidden shrink-0">
                            {inquiry.listing?.media?.[0]?.url ? (
                              <Image
                                src={inquiry.listing.media[0].url}
                                alt={inquiry.listing.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-slate-200 flex items-center justify-center">
                                <Car className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate">{inquiry.name}</p>
                              {inquiry.status === 'NEW' && (
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {inquiry.listing?.title || `${inquiry.listing?.year} ${inquiry.listing?.make} ${inquiry.listing?.model}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  inquiry.status === 'NEW'
                                    ? 'default'
                                    : inquiry.status === 'REPLIED'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {inquiry.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(inquiry.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this conversation?')) {
                            handleArchive(inquiry.id);
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
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedInquiry.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedInquiry.email}
                      {selectedInquiry.phone && ` • ${selectedInquiry.phone}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        selectedInquiry.status === 'NEW'
                          ? 'default'
                          : selectedInquiry.status === 'REPLIED'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {selectedInquiry.status}
                    </Badge>
                    {selectedInquiry.status !== 'ARCHIVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(selectedInquiry.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vehicle Info */}
                {selectedInquiry.listing && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <div className="flex items-center gap-4">
                      {selectedInquiry.listing.media?.[0]?.url && (
                        <div className="relative h-20 w-28 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={selectedInquiry.listing.media[0].url}
                            alt={selectedInquiry.listing.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Link
                          href={`/vehicles/${selectedInquiry.listing.slug}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {selectedInquiry.listing.title ||
                            `${selectedInquiry.listing.year} ${selectedInquiry.listing.make} ${selectedInquiry.listing.model}`}
                        </Link>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatPrice(selectedInquiry.listing.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                    
                    return allMessages.map((msg: any, idx: number) => {
                      if (msg.type === 'user') {
                        return (
                          <motion.div
                            key={`user-${msg.id}-${idx}`}
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="flex justify-start"
                          >
                            <div className="flex items-end gap-2 max-w-[75%]">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-muted-foreground" />
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
                      } else {
                        return (
                          <motion.div
                            key={`dealer-${msg.id}-${idx}`}
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
                                {msg.timestamp && (
                                  <span className="text-xs text-muted-foreground mt-1 px-2">
                                    {msg.timestamp}
                                  </span>
                                )}
                              </div>
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          </motion.div>
                        );
                      }
                    });
                  })()}

                  {/* Typing Indicator (when replying) */}
                  {isReplying && (
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

                {/* Reply Input - WhatsApp Style - Always visible */}
                <div className="sticky bottom-0 bg-background border-t pt-4 mt-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type a message..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (replyText.trim() && !isReplying) {
                              handleReply();
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
                        onClick={handleReply}
                        disabled={!replyText.trim() || isReplying || !selectedInquiry}
                        size="icon"
                        className="h-11 w-11 rounded-full"
                      >
                        {isReplying ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Reply className="h-5 w-5" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </a>
                  {selectedInquiry.phone && (
                    <a href={`tel:${selectedInquiry.phone}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Select a message</p>
                <p className="text-sm text-muted-foreground text-center">
                  Choose an inquiry from the list to view details and reply
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

