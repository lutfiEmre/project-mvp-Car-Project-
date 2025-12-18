'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Search,
  Filter,
  Loader2,
  Car,
  User,
  Building2,
  Check,
  CheckCheck,
  Clock,
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
import { formatPrice, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminMessagesPage() {
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['admin', 'inquiries', statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/inquiries?status=${statusFilter === 'all' ? '' : statusFilter}&take=100`,
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
    refetchInterval: 10000,
  });

  const inquiries = inquiriesData?.data || [];

  const parseMessages = (messageText: string) => {
    if (!messageText) return [];
    
    const messages: any[] = [];
    const timestampPattern = /---\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}(?::\d{2})?\s+[AP]M)\s*---/g;
    
    const timestampMatches: { index: number; timestamp: string; fullMatch: string }[] = [];
    let match;
    while ((match = timestampPattern.exec(messageText)) !== null) {
      timestampMatches.push({
        index: match.index,
        timestamp: match[1],
        fullMatch: match[0],
      });
    }
    
    if (timestampMatches.length === 0) {
      return [{
        id: 0,
        text: messageText.trim(),
        timestamp: null,
      }];
    }
    
    const firstTimestampIndex = timestampMatches[0].index;
    const firstMessage = messageText.substring(0, firstTimestampIndex).trim();
    if (firstMessage) {
      messages.push({
        id: messages.length,
        text: firstMessage,
        timestamp: null,
      });
    }
    
    for (let i = 0; i < timestampMatches.length; i++) {
      const current = timestampMatches[i];
      const nextIndex = i + 1 < timestampMatches.length 
        ? timestampMatches[i + 1].index 
        : messageText.length;
      
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedInquiry?.message, selectedInquiry?.reply]);

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    const matchesSearch =
      inquiry.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.dealer?.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getReadStatus = (inquiry: any) => {
    const hasReply = !!inquiry.reply;
    const userRead = !!inquiry.userReadAt;
    const dealerRead = !!inquiry.dealerReadAt;
    
    return { hasReply, userRead, dealerRead };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">All Messages</h1>
          <p className="text-muted-foreground mt-1">
            View all conversations between users and dealers
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages Log ({filteredInquiries.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages found</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredInquiries.map((inquiry: any) => {
                    const readStatus = getReadStatus(inquiry);
                    return (
                      <button
                        key={inquiry.id}
                        onClick={() => setSelectedInquiry(inquiry)}
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
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium truncate">{inquiry.name}</span>
                              <span className="text-muted-foreground">→</span>
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm truncate">{inquiry.dealer?.businessName || 'Unknown'}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
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
                              {readStatus.hasReply && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  {readStatus.userRead ? (
                                    <CheckCheck className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(inquiry.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedInquiry ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedInquiry.name}
                      <span className="text-muted-foreground font-normal">→</span>
                      <Building2 className="h-5 w-5" />
                      {selectedInquiry.dealer?.businessName || 'Unknown Dealer'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedInquiry.email}
                      {selectedInquiry.phone && ` • ${selectedInquiry.phone}`}
                    </p>
                  </div>
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
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  {(() => {
                    const userMessages = parseMessages(selectedInquiry.message || '');
                    const dealerReplies = selectedInquiry.reply ? parseMessages(selectedInquiry.reply) : [];
                    
                    const parseTimestamp = (timestampStr: string | null): number => {
                      if (!timestampStr) return 0;
                      try {
                        let normalized = timestampStr.trim();
                        let date = new Date(normalized);
                        let time = date.getTime();
                        
                        if (isNaN(time) || time === 0) {
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
                    
                    const allMessages: any[] = [];
                    const createdAtTime = new Date(selectedInquiry.createdAt).getTime();
                    
                    userMessages.forEach((msg: any, idx: number) => {
                      let msgTime = parseTimestamp(msg.timestamp);
                      if (msgTime === 0) {
                        msgTime = createdAtTime + (idx * 100);
                      }
                      
                      allMessages.push({
                        ...msg,
                        type: 'user',
                        timestampValue: msgTime,
                      });
                    });
                    
                    dealerReplies.forEach((reply: any, idx: number) => {
                      let replyTime = parseTimestamp(reply.timestamp);
                      if (replyTime === 0) {
                        replyTime = createdAtTime + 1000 + (idx * 100);
                      }
                      
                      allMessages.push({
                        ...reply,
                        type: 'dealer',
                        timestampValue: replyTime,
                      });
                    });
                    
                    allMessages.sort((a, b) => a.timestampValue - b.timestampValue);
                    
                    if (allMessages.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground">No messages</p>
                        </div>
                      );
                    }
                    
                    return allMessages.map((msg: any, idx: number) => {
                      const isUser = msg.type === 'user';
                      const readStatus = getReadStatus(selectedInquiry);
                      
                      return (
                        <motion.div
                          key={`${msg.type}-${msg.id}-${idx}`}
                          initial={{ opacity: 0, x: isUser ? -20 : 20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[75%] ${isUser ? '' : 'flex-row-reverse'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                              isUser ? 'bg-muted' : 'bg-primary/20'
                            }`}>
                              {isUser ? (
                                <User className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Building2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                              <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                isUser 
                                  ? 'bg-card border rounded-tl-sm' 
                                  : 'bg-primary text-primary-foreground rounded-tr-sm shadow-md'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                              </div>
                              <div className="flex items-center gap-1 mt-1 px-2">
                                {msg.timestamp && (
                                  <span className="text-xs text-muted-foreground">
                                    {msg.timestamp}
                                  </span>
                                )}
                                {!isUser && (
                                  <span className="ml-1">
                                    {readStatus.userRead ? (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <Check className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </span>
                                )}
                                {isUser && idx === 0 && (
                                  <span className="ml-1">
                                    {readStatus.dealerRead ? (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <Check className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                  <div ref={messagesEndRef} />
                </div>

                <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                  <p>
                    <Clock className="h-3 w-3 inline mr-1" />
                    Created: {formatDate(selectedInquiry.createdAt)}
                  </p>
                  {selectedInquiry.dealerReadAt && (
                    <p>
                      <CheckCheck className="h-3 w-3 inline mr-1 text-blue-500" />
                      Dealer read: {formatDate(selectedInquiry.dealerReadAt)}
                    </p>
                  )}
                  {selectedInquiry.userReadAt && (
                    <p>
                      <CheckCheck className="h-3 w-3 inline mr-1 text-blue-500" />
                      User read: {formatDate(selectedInquiry.userReadAt)}
                    </p>
                  )}
                  {selectedInquiry.repliedAt && (
                    <p>
                      <Check className="h-3 w-3 inline mr-1" />
                      Last reply: {formatDate(selectedInquiry.repliedAt)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Select a conversation</p>
                <p className="text-sm text-muted-foreground text-center">
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

