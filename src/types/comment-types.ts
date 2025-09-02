export interface CommentUser {
  id: string;
  name: string;
  avatar?: string;
  isVerified?: boolean;
  isAnonymous?: boolean;
  isGuest?: boolean;
}

export interface CommentVote {
  commentId: string;
  userId: string;
  type: 'upvote' | 'downvote';
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  author: CommentUser;
  createdAt: Date;
  updatedAt?: Date;
  upvotes: number;
  downvotes: number;
  replies: Comment[];
  parentId?: string;
  isEdited?: boolean;
  userVote?: 'upvote' | 'downvote';
}

export interface CommentFormData {
  content: string;
  parentId?: string;
  isAnonymous?: boolean;
}

export interface AnonymousCommentOptions {
  allowAnonymous: boolean;
  anonymousDisplayName?: string;
  requireModeration?: boolean;
}

export interface PublicCommentOptions {
  requireLogin: boolean;
  allowGuestComments: boolean;
  defaultGuestName?: string;
  showAllComments: boolean;
  enableVoting: boolean;
  enableReplies: boolean;
}

export interface CommentStats {
  totalComments: number;
  totalReplies: number;
}

export type CommentSortType = 'recent' | 'oldest' | 'popular';

export interface CommentSystemState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  sortBy: CommentSortType;
}

export interface CommentFormattingOption {
  type: 'bold' | 'italic' | 'underline' | 'link' | 'attachment' | 'emoji' | 'mention';
  icon: React.ComponentType<any>;
  action: (editor: any) => void;
}
