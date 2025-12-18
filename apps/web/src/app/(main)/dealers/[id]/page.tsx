'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Loader2,
  Calendar,
  Clock,
  ArrowLeft,
  Car,
  MessageSquare,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VehicleCard } from '@/components/vehicles/vehicle-card';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function DealerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealerId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  const { data: dealer, isLoading, error } = useQuery({
    queryKey: ['dealer', dealerId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/${dealerId}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Dealer not found');
        }
        throw new Error('Failed to fetch dealer');
      }
      return response.json();
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; title?: string; content: string }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/dealers/${dealerId}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create review');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer', dealerId] });
      queryClient.invalidateQueries({ queryKey: ['dealer', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dealer', 'me'] });
      setReviewForm({ rating: 5, title: '', content: '' });
      setShowReviewForm(false);
      toast.success('Review submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.save(listingId),
    onSuccess: (data, listingId) => {
      setSavedListings(prev => new Set(prev).add(listingId));
      toast.success('Vehicle saved to favorites');
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save vehicle');
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (listingId: string) => api.listings.unsave(listingId),
    onSuccess: (data, listingId) => {
      setSavedListings(prev => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
      toast.success('Vehicle removed from favorites');
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove vehicle');
    },
  });

  const handleToggleSave = async (listingId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save vehicles');
      router.push('/login');
      return;
    }

    if (savedListings.has(listingId)) {
      await unsaveMutation.mutateAsync(listingId);
    } else {
      await saveMutation.mutateAsync(listingId);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.content.trim()) {
      toast.error('Please write a review');
      return;
    }
    createReviewMutation.mutate({
      rating: reviewForm.rating,
      title: reviewForm.title || undefined,
      content: reviewForm.content,
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      api.listings.getSaved()
        .then((savedData) => {
          const savedIds = new Set(savedData.map((listing: any) => listing.id));
          setSavedListings(savedIds);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !dealer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Dealer Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The dealer you're looking for doesn't exist.
          </p>
          <Link href="/dealers">
            <Button>Back to Dealers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const listings = dealer.listings || [];
  const reviews = dealer.reviews || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary to-primary/80 overflow-hidden">
        {dealer.bannerImage && (
          <Image
            src={dealer.bannerImage}
            alt={dealer.businessName}
            fill
            className="object-cover opacity-30"
          />
        )}
        
        {/* Animated decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating cars */}
          <motion.div
            className="absolute top-10 right-10 md:right-20"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Car className="h-16 w-16 md:h-20 md:w-20 text-white/20" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-10 left-10 md:left-20"
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <Car className="h-12 w-12 md:h-16 md:w-16 text-white/15" />
          </motion.div>

          {/* Animated circles */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-24 h-24 md:w-40 md:h-40 rounded-full bg-white/10 blur-3xl"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 h-full flex flex-col justify-between">
          <Link href="/dealers">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dealers
              </Button>
            </motion.div>
          </Link>

          {/* Dealer name and info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{dealer.businessName}</h1>
              {dealer.verified && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
                >
                  <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-green-300" />
                </motion.div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              {dealer.city && dealer.province && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm md:text-base">{dealer.city}, {dealer.province}</span>
                </div>
              )}
              {dealer.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  <span className="text-sm md:text-base font-semibold">{dealer.rating.toFixed(1)}</span>
                  {dealer.reviewCount > 0 && (
                    <span className="text-sm md:text-base">({dealer.reviewCount} reviews)</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span className="text-sm md:text-base">{dealer.totalListings || listings.length} Listings</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  {/* Logo */}
                  <div className="flex justify-center mb-6">
                    {dealer.logo ? (
                      <Image
                        src={dealer.logo}
                        alt={dealer.businessName}
                        width={120}
                        height={120}
                        className="rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-30 w-30 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Business Name */}
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">{dealer.businessName}</h1>
                      {dealer.verified && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {dealer.rating && (
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{dealer.rating.toFixed(1)}</span>
                        {dealer.reviewCount > 0 && (
                          <span className="text-sm text-muted-foreground">
                            ({dealer.reviewCount} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Contact Info */}
                  <div className="space-y-3">
                    {dealer.city && dealer.province && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{dealer.city}, {dealer.province}</p>
                          {dealer.address && (
                            <p className="text-sm text-muted-foreground">{dealer.address}</p>
                          )}
                          {dealer.postalCode && (
                            <p className="text-sm text-muted-foreground">{dealer.postalCode}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {dealer.contactPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                        <a
                          href={`tel:${dealer.contactPhone}`}
                          className="text-sm hover:text-primary transition-colors"
                        >
                          {dealer.contactPhone}
                        </a>
                      </div>
                    )}

                    {dealer.contactEmail && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                        <a
                          href={`mailto:${dealer.contactEmail}`}
                          className="text-sm hover:text-primary transition-colors"
                        >
                          {dealer.contactEmail}
                        </a>
                      </div>
                    )}

                    {dealer.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                        <a
                          href={dealer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:text-primary transition-colors"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Social Media */}
                  {(dealer.facebook || dealer.instagram || dealer.twitter || dealer.youtube) && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex gap-3 justify-center">
                        {dealer.facebook && (
                          <a
                            href={dealer.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {dealer.instagram && (
                          <a
                            href={dealer.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {dealer.twitter && (
                          <a
                            href={dealer.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {dealer.youtube && (
                          <a
                            href={dealer.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          >
                            <Youtube className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </>
                  )}

                  {/* Business Hours */}
                  {dealer.businessHours && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Business Hours
                        </h3>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">
                          {dealer.businessHours}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stats */}
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{dealer.totalListings || listings.length}</p>
                      <p className="text-xs text-muted-foreground">Listings</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{dealer.reviewCount || reviews.length}</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            {dealer.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">About</h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {dealer.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Listings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Vehicles ({listings.length})
                </h2>
              </div>

              {listings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Listings Available</h3>
                    <p className="text-muted-foreground">
                      This dealer doesn't have any active listings at the moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {listings.map((listing: any, index: number) => (
                    <VehicleCard 
                      key={listing.id} 
                      listing={listing} 
                      index={index}
                      saved={savedListings.has(listing.id)}
                      onSave={handleToggleSave}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>
                {!showReviewForm && (
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push(`/login?redirect=/dealers/${dealerId}`);
                        return;
                      }
                      setShowReviewForm(true);
                    }}
                    variant="outline"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Write a Review
                  </Button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    {!isAuthenticated ? (
                      <div className="text-center py-8">
                        <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Login Required</h3>
                        <p className="text-muted-foreground mb-4">
                          Please login to write a review for this dealer.
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Button onClick={() => router.push(`/login?redirect=/dealers/${dealerId}`)}>
                            <LogIn className="mr-2 h-4 w-4" />
                            Login
                          </Button>
                          <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                          <Label>Rating</Label>
                          <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating })}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-6 w-6 transition-colors ${
                                    rating <= reviewForm.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300 hover:text-yellow-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="title">Title (Optional)</Label>
                          <Input
                            id="title"
                            value={reviewForm.title}
                            onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                            placeholder="Review title..."
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="content">Review</Label>
                          <Textarea
                            id="content"
                            value={reviewForm.content}
                            onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                            placeholder="Share your experience with this dealer..."
                            className="mt-2 min-h-[120px]"
                            required
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            disabled={createReviewMutation.isPending}
                          >
                            {createReviewMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Review'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowReviewForm(false);
                              setReviewForm({ rating: 5, title: '', content: '' });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                    <p className="text-muted-foreground">
                      Be the first to review this dealer!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.reviewerName || 'Anonymous'}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.createdAt && (
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {review.title && (
                          <h4 className="font-medium mt-2 mb-1">{review.title}</h4>
                        )}
                        {review.content && (
                          <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{review.content}</p>
                        )}
                        
                        {/* Dealer Response */}
                        {review.dealerResponse && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Dealer Response</span>
                              {review.dealerResponseAt && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {formatDate(review.dealerResponseAt)}
                                </span>
                              )}
                            </div>
                            <div className="rounded-lg bg-primary/5 p-4">
                              <p className="text-sm whitespace-pre-wrap">{review.dealerResponse}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

