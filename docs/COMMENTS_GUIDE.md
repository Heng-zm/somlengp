# Firestore Comments System Guide

This guide explains how to use the Firestore-powered comments system in your Next.js application.

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import { FirestoreCommentsExample } from '@/components/comments/FirestoreCommentsExample';

function MyPage() {
  return (
    <div>
      <h1>My Content</h1>
      <FirestoreCommentsExample 
        pageId="my-page-1" 
        userId="user123" // Optional: for authenticated users
      />
    </div>
  );
}
```

### 2. Using the Hook Directly

```tsx
import { useComments } from '@/hooks/use-comments';

function CustomCommentsComponent() {
  const { state, actions, stats, hasMore } = useComments({
    pageId: 'my-custom-page',
    userId: 'user123', // Optional
    anonymousOptions: {
      allowAnonymous: true,
      anonymousDisplayName: 'Anonymous User',
      requireModeration: false
    }
  });

  const handleSubmit = async (content: string) => {
    await actions.submitComment(content);
  };

  return (
    <div>
      <div>Comments: {stats.totalComments}</div>
      {/* Your custom UI */}
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

Make sure you have the following Firebase environment variables set in your `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Firebase Setup Steps

1. **Create a Firebase Project** (if you haven't already)
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create or select your project

2. **Enable Firestore**
   - Go to Firestore Database in Firebase Console
   - Click "Create database"
   - Choose production mode
   - Select your location

3. **Deploy Security Rules**
   ```bash
   npm run firestore:rules:deploy
   ```

4. **Validate Configuration**
   ```bash
   npm run firebase:validate
   ```

## 📊 Features

### ✅ Core Features
- **Public Comments**: Anyone can read comments
- **Anonymous Comments**: Allow users to comment without authentication
- **Guest Comments**: Public users can comment with generated names
- **Authenticated Comments**: Logged-in users can comment with their identity
- **Nested Replies**: Support for threaded discussions
- **Voting System**: Upvote/downvote comments (requires authentication)
- **Real-time Updates**: Comments update automatically
- **Sorting**: Sort by recent, oldest, or popularity
- **Pagination**: Load more comments as needed
- **Edit/Delete**: Comment authors can edit/delete their comments

### 🔒 Security Features
- **Firestore Security Rules**: Comprehensive rules to protect data
- **Content Validation**: Max 2000 character limit, required fields
- **Author Verification**: Only authors can edit/delete their comments
- **Anonymous ID Patterns**: Validation for anonymous/guest user IDs
- **Vote Protection**: Users can only vote once per comment

## 🎯 Use Cases

### 1. Blog Comments
```tsx
<FirestoreCommentsExample 
  pageId={`blog-post-${postId}`}
  userId={user?.id}
/>
```

### 2. Course Lesson Comments
```tsx
<FirestoreCommentsExample 
  pageId={`lesson-${courseId}-${lessonId}`}
  userId={student?.id}
/>
```

### 3. Product Reviews
```tsx
<FirestoreCommentsExample 
  pageId={`product-${productId}`}
  userId={customer?.id}
/>
```

## 🛠️ API Reference

### `useComments` Hook

#### Parameters
```tsx
interface UseCommentsProps {
  pageId?: string;              // Unique identifier for the content
  userId?: string;              // Current user ID (optional)
  initialComments?: Comment[];  // Preloaded comments (optional)
  anonymousOptions?: {          // Anonymous commenting settings
    allowAnonymous: boolean;
    anonymousDisplayName?: string;
    requireModeration?: boolean;
  };
}
```

#### Returns
```tsx
interface UseCommentsReturn {
  state: {
    comments: Comment[];        // Array of comments with nested replies
    loading: boolean;          // Loading state
    error: string | null;      // Error message if any
    submitting: boolean;       // Submitting state
    sortBy: CommentSortType;   // Current sort order
  };
  stats: {
    totalComments: number;     // Count of top-level comments
    totalReplies: number;      // Count of all replies
  };
  actions: {
    submitComment: (content: string, parentId?: string, isAnonymous?: boolean) => Promise<void>;
    submitAnonymousComment: (content: string, parentId?: string) => Promise<void>;
    voteComment: (commentId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
    editComment: (commentId: string, content: string) => Promise<void>;
    deleteComment: (commentId: string) => Promise<void>;
    setSortBy: (sortType: CommentSortType) => void;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
  };
  hasMore: boolean;            // Whether more comments can be loaded
  anonymousOptions: object;    // Current anonymous options
}
```

### Comment Data Structure

```tsx
interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
    isAnonymous?: boolean;
    isGuest?: boolean;
  };
  createdAt: Date;
  updatedAt?: Date;
  upvotes: number;
  downvotes: number;
  replies: Comment[];
  parentId?: string;
  isEdited?: boolean;
  userVote?: 'upvote' | 'downvote';
}
```

## 🚀 Advanced Usage

### Custom Comment Component

```tsx
import { useComments } from '@/hooks/use-comments';
import { Comment } from '@/types/comment-types';

function AdvancedComments({ pageId, userId }: { pageId: string; userId?: string }) {
  const { state, actions, stats } = useComments({ pageId, userId });

  return (
    <div className="comments-container">
      {/* Custom header */}
      <div className="comments-header">
        <h3>{stats.totalComments} Comments</h3>
        <select onChange={(e) => actions.setSortBy(e.target.value as any)}>
          <option value="recent">Recent</option>
          <option value="popular">Popular</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Custom comment form */}
      <CommentForm onSubmit={actions.submitComment} />

      {/* Custom comment list */}
      {state.comments.map(comment => (
        <CustomCommentItem
          key={comment.id}
          comment={comment}
          onReply={(content) => actions.submitComment(content, comment.id)}
          onVote={actions.voteComment}
          onEdit={actions.editComment}
          onDelete={actions.deleteComment}
          canEdit={userId === comment.author.id}
        />
      ))}
    </div>
  );
}
```

### Integration with Authentication

```tsx
// Example with NextAuth
import { useSession } from 'next-auth/react';

function AuthenticatedComments({ pageId }: { pageId: string }) {
  const { data: session } = useSession();
  
  return (
    <FirestoreCommentsExample 
      pageId={pageId}
      userId={session?.user?.id}
    />
  );
}
```

## 📝 NPM Scripts

- `npm run firebase:validate` - Validate Firebase configuration
- `npm run firestore:rules:deploy` - Deploy Firestore security rules
- `npm run firestore:rules:validate` - Validate security rules
- `npm run firestore:emulator` - Start Firestore emulator for testing
- `npm run comments:test` - Test comments integration

## 🐛 Troubleshooting

### Common Issues

1. **Firebase not initialized**
   ```bash
   npm run firebase:validate
   ```

2. **Permission denied errors**
   - Check your Firestore security rules
   - Ensure user is authenticated for protected actions

3. **Comments not loading**
   - Verify `pageId` is consistent
   - Check browser console for errors
   - Ensure Firebase configuration is correct

4. **Voting not working**
   - Voting requires user authentication
   - Check that `userId` is provided to the hook

### Debug Mode

Add this to enable detailed logging:

```tsx
const { state } = useComments({
  pageId: 'debug-page',
  userId: 'debug-user'
});

// Check state in console
console.log('Comments state:', state);
```

## 🔄 Migration from Mock Data

If you were previously using mock data, the system will automatically fallback to mock comments if Firestore fails to load. This ensures your application continues to work during development and provides a smooth transition.

## 📚 Next Steps

1. **Customize Styling**: Modify the `FirestoreCommentsExample` component styles
2. **Add Moderation**: Implement comment moderation features
3. **Real-time Updates**: Add real-time listeners for live comment updates
4. **Rich Text**: Integrate rich text editor for comment formatting
5. **Notifications**: Add email/push notifications for new comments
6. **Analytics**: Track comment engagement metrics

---

Need help? Check the [Firebase Documentation](https://firebase.google.com/docs/firestore) or create an issue in the project repository.
