'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  author: string;
  initials: string;
  content: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  replies?: Comment[];
  isVerified?: boolean;
}

// Mock comment data that matches your screenshot
const mockComments: Comment[] = [
  {
    id: '1',
    author: 'Learning Enthusiast',
    initials: 'LE',
    content: "I'm a teacher and I appreciate how accessible this content is for everyone. No barriers to learning!",
    timestamp: '3 minutes ago',
    upvotes: 7,
    downvotes: 0,
    userVote: null
  },
  {
    id: '2', 
    author: 'Guest Visitor',
    initials: 'GV',
    content: "This is so helpful! I'm just browsing without an account and love that I can still participate in the discussion.",
    timestamp: '15 minutes ago',
    upvotes: 4,
    downvotes: 0,
    userVote: null,
    replies: [
      {
        id: '2-1',
        author: 'Public User',
        initials: 'PU',
        content: "I agree! It's great that this platform welcomes everyone to share their thoughts.",
        timestamp: '10 minutes ago',
        upvotes: 2,
        downvotes: 0,
        userVote: null
      }
    ]
  },
  {
    id: '3',
    author: 'Anonymous Learner', 
    initials: 'AL',
    content: "I prefer not to use my real name, but I wanted to say this explanation was really helpful. Thank you!",
    timestamp: '30 minutes ago',
    upvotes: 6,
    downvotes: 0,
    userVote: null
  },
  {
    id: '4',
    author: 'Noah Pierre',
    initials: 'NP', 
    content: "I'm a bit unclear about how condensation forms in the water cycle. Can someone break it down?",
    timestamp: '58 minutes ago',
    upvotes: 25,
    downvotes: 3,
    userVote: null,
    replies: [
      {
        id: '4-1',
        author: 'Skill Sprout',
        initials: 'SS',
        content: "Condensation happens when water vapor cools down and changes back into liquid droplets. It's the step before precipitation. The example with the glass of ice water in the video was a great visual!",
        timestamp: '8 minutes ago',
        upvotes: 2,
        downvotes: 0,
        userVote: null,
        isVerified: true
      }
    ]
  },
  {
    id: '5',
    author: 'Mollie Hall',
    initials: 'MH',
    content: "I really enjoyed today's lesson on the water cycle! The animations made the processes so much easier to grasp.",
    timestamp: '5 hours ago',
    upvotes: 8,
    downvotes: 2,
    userVote: null
  }
];

interface CommentItemProps {
  comment: Comment;
  onVote: (commentId: string, type: 'up' | 'down') => void;
  isReply?: boolean;
}

function CommentItem({ comment, onVote, isReply = false }: CommentItemProps) {
  return (
    <div className={cn("flex gap-3", isReply && "ml-8 mt-3")}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
          {comment.initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-900">{comment.author}</span>
          {comment.isVerified && (
            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          <span className="text-gray-500">{comment.timestamp}</span>
        </div>
        
        <p className="text-gray-700 text-sm leading-relaxed">
          {comment.content}
        </p>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-xs",
                comment.userVote === 'up' && "bg-green-100 text-green-700"
              )}
              onClick={() => onVote(comment.id, 'up')}
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              {comment.upvotes}
            </Button>
            
            <Button
              variant="ghost" 
              size="sm"
              className={cn(
                "h-6 px-2 text-xs",
                comment.userVote === 'down' && "bg-red-100 text-red-700"
              )}
              onClick={() => onVote(comment.id, 'down')}
            >
              <ThumbsDown className="w-3 h-3 mr-1" />
              {comment.downvotes}
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500">
            <MessageCircle className="w-3 h-3 mr-1" />
            Reply
          </Button>
        </div>
        
        {/* Render replies */}
        {comment.replies && comment.replies.map((reply: Comment) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            onVote={onVote}
            isReply={true}
          />
        ))}
      </div>
    </div>
  );
}

export default function CommentsExample() {
  const [showAll, setShowAll] = useState(false);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const INITIAL_LIMIT = 3;
  
  const displayedComments = showAll ? comments : comments.slice(0, INITIAL_LIMIT);
  const hiddenCount = comments.length - INITIAL_LIMIT;
  const hasMore = comments.length > INITIAL_LIMIT;
  
  const handleVote = (commentId: string, type: 'up' | 'down') => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const currentVote = comment.userVote;
        let newUpvotes = comment.upvotes;
        let newDownvotes = comment.downvotes;
        let newUserVote: 'up' | 'down' | null = null;
        
        // Remove previous vote
        if (currentVote === 'up') newUpvotes--;
        if (currentVote === 'down') newDownvotes--;
        
        // Add new vote if different from current
        if (currentVote !== type) {
          if (type === 'up') {
            newUpvotes++;
            newUserVote = 'up';
          } else {
            newDownvotes++;
            newUserVote = 'down';
          }
        }
        
        return {
          ...comment,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: newUserVote
        };
      }
      return comment;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Comments
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {comments.length}
              </span>
              <div className="ml-auto">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Most recent
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {displayedComments.map((comment, index) => (
              <div
                key={comment.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <CommentItem comment={comment} onVote={handleVote} />
              </div>
            ))}
            
            {hasMore && (
              <div className="flex flex-col items-center space-y-2 pt-4">
                {!showAll && (
                  <p className="text-sm text-gray-500">
                    {hiddenCount} more comment{hiddenCount !== 1 ? 's' : ''}
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className={cn(
                    "group transition-all duration-200 hover:scale-105",
                    !showAll 
                      ? "text-blue-600 border-blue-200 hover:bg-blue-50"
                      : "text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                      See more comments ({hiddenCount})
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
