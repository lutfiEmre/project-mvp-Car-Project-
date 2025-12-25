'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, Loader2, MessageSquare, Reply, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [respondingToReview, setRespondingToReview] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({});
  
  const { data: reviewsData, isLoading, refetch, error } = useQuery({
    queryKey: ['dealer', 'reviews'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch reviews:', response.status, errorText);
        throw new Error(`Failed to fetch reviews: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔵 Reviews API Response:', JSON.stringify(data, null, 2));
      console.log('🔵 Reviews data array:', data?.data);
      console.log('🔵 Reviews count:', data?.data?.length || 0);
      console.log('🔵 Reviews meta:', data?.meta);
      
      // Ensure data is in the expected format
      if (!data.data && Array.isArray(data)) {
        // If API returns array directly, wrap it
        return { data, meta: { total: data.length, skip: 0, take: 50 } };
      }
      
      return data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
  });

  const reviews = reviewsData?.data || [];
  console.log('Parsed reviews:', reviews);
  console.log('Reviews length:', reviews.length);

  const deleteReviewMutation = useMutation({
    mutationFn: async ({ reviewId, reviewType }: { reviewId: string; reviewType: 'dealer' | 'listing' }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/reviews/${reviewId}?type=${reviewType}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete review');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer', 'reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete review');
    },
  });

  const respondToReviewMutation = useMutation({
    mutationFn: async ({ reviewId, response, reviewType, listingId }: { reviewId: string; response: string; reviewType?: string; listingId?: string }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      // Use different endpoint based on review type
      let endpoint;
      if (reviewType === 'listing' && listingId) {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/listings/${listingId}/reviews/${reviewId}/response`;
      } else {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/me/reviews/${reviewId}/response`;
      }

      const apiResponse = await fetch(
        endpoint,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ response }),
        }
      );

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(errorText || 'Failed to add response');
      }

      return apiResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['listing', 'reviews'] });
      setRespondingToReview(null);
      setResponseText({});
      toast.success('Response added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add response');
    },
  });

  const handleRespond = (reviewId: string) => {
    setRespondingToReview(reviewId);
    setResponseText({ ...responseText, [reviewId]: '' });
  };

  const handleSubmitResponse = (reviewId: string, review: any) => {
    const response = responseText[reviewId]?.trim();
    if (!response) {
      toast.error('Please enter a response');
      return;
    }
    respondToReviewMutation.mutate({ 
      reviewId, 
      response,
      reviewType: review.type,
      listingId: review.listing?.id || review.listingId,
    });
  };

  const handleCancelResponse = (reviewId: string) => {
    setRespondingToReview(null);
    setResponseText({ ...responseText, [reviewId]: '' });
  };

  // Calculate rating stats
  const ratingStats = {
    average: reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0,
    total: reviews.length,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((r: any) => r.rating === stars).length,
    })),
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold text-red-600 mb-2">Error loading reviews</p>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={() => refetch()}>
          Try Again
        </Button>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Debug Info:</p>
          <pre className="mt-2 text-left bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
            {JSON.stringify({ error: error.message, reviewsData, reviews }, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">
            Manage and respond to customer reviews
          </p>
          {reviewsData && (
            <div className="text-xs text-muted-foreground mt-1 space-y-1 bg-slate-100 dark:bg-slate-800 p-2 rounded">
              <p><strong>API Response:</strong> {reviewsData?.meta?.total || 0} total dealer reviews</p>
              <p><strong>Parsed:</strong> {reviews.length} reviews</p>
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                ⚠️ Not: This page shows reviews for your dealer profile. 
                Listing reviews are shown on the inventory page.
              </p>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {/* Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-6 mb-8"
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div className="text-center md:text-left">
            <div className="flex items-baseline gap-2 justify-center md:justify-start">
              <span className="text-5xl font-bold">
                {ratingStats.average > 0 ? ratingStats.average.toFixed(1) : '0.0'}
              </span>
              <span className="text-2xl text-muted-foreground">/5</span>
            </div>
            <div className="flex items-center gap-1 justify-center md:justify-start mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(ratingStats.average)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on {ratingStats.total} review{ratingStats.total !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-2">
            {ratingStats.distribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-2">
                <span className="w-12 text-sm">{item.stars} stars</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ 
                      width: `${ratingStats.total > 0 ? (item.count / ratingStats.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="w-10 text-sm text-muted-foreground text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">
              You haven't received any reviews yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any, index: number) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {review.reviewerName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'AN'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{review.reviewerName || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {review.isPublished ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Published</span>
                  ) : (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Pending</span>
                  )}
                  {(review.isOwnReview || review.type === 'listing') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this review?')) {
                          deleteReviewMutation.mutate({
                            reviewId: review.id,
                            reviewType: review.type,
                          });
                        }
                      }}
                      disabled={deleteReviewMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {review.title && (
                <h4 className="font-medium mt-4 mb-2">{review.title}</h4>
              )}

              {/* Show listing info for listing reviews */}
              {review.type === 'listing' && review.listing && (
                <div className="mt-3 mb-2 p-2 bg-muted/50 rounded text-sm">
                  <span className="text-muted-foreground">Review for: </span>
                  <Link 
                    href={`/vehicles/${review.listing.slug || review.listing.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {review.listing.title}
                  </Link>
                </div>
              )}

              <p className="mt-4 text-muted-foreground whitespace-pre-wrap">
                {review.content}
              </p>

              {/* Dealer Response */}
              {review.dealerResponse ? (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Your Response</span>
                    {review.dealerResponseAt && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(review.dealerResponseAt)}
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg bg-primary/5 p-4">
                    <p className="text-sm whitespace-pre-wrap">{review.dealerResponse}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleRespond(review.id)}
                  >
                    <Reply className="mr-2 h-3 w-3" />
                    Edit Response
                  </Button>
                </div>
              ) : respondingToReview === review.id ? (
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-3">
                    <div>
                      <Textarea
                        placeholder="Write your response to this review..."
                        value={responseText[review.id] || ''}
                        onChange={(e) =>
                          setResponseText({ ...responseText, [review.id]: e.target.value })
                        }
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitResponse(review.id, review)}
                        disabled={respondToReviewMutation.isPending}
                      >
                        {respondToReviewMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Reply className="mr-2 h-3 w-3" />
                            Send Response
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelResponse(review.id)}
                        disabled={respondToReviewMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRespond(review.id)}
                  >
                    <Reply className="mr-2 h-3 w-3" />
                    Respond to Review
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
