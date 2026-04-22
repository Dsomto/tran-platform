"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, CheckCircle } from "lucide-react";

export default function FeedbackPage() {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState({ firstName: "", lastName: "", avatarUrl: null as string | null });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, rating }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit");
        return;
      }

      setSuccess(true);
      setContent("");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Topbar
        title="Feedback & Testimonials"
        subtitle="Share your experience"
        firstName={user.firstName}
        lastName={user.lastName}
        avatarUrl={user.avatarUrl}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {success ? (
            <Card variant="glass" className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Thank You!
              </h3>
              <p className="text-sm text-muted mb-6">
                Your feedback has been submitted successfully.
              </p>
              <Button variant="outline" onClick={() => setSuccess(false)}>
                Submit Another
              </Button>
            </Card>
          ) : (
            <Card variant="glass">
              <CardContent>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Share Your Feedback
                    </h3>
                    <p className="text-xs text-muted">
                      Your testimonial may be featured on the website
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-border fill-transparent"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    id="content"
                    label="Your Experience"
                    placeholder="Tell us about your journey at UBI — what you learned, how it helped your career, what stood out..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="min-h-[150px]"
                  />

                  {error && (
                    <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                      <p className="text-sm text-danger">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Submit Feedback
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
