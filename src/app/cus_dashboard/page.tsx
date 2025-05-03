'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signout } from "../actions/auth";

interface Comment {
  id: number;
  text: string;
  author: string;
  createdAt: string | undefined;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  comments?: Comment[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'add-post'>('home');
  const [showOnlyMine, setShowOnlyMine] = useState<boolean>(false);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const router = useRouter();

  const [newComment, setNewComment] = useState<Record<number, string>>({});


  // Sample posts data with proper typing
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      title: 'My First Post',
      content: 'This is the content of my first post. It contains details about my experience...',
      author: 'user@example.com',
      createdAt: '2023-10-15'
    },
    {
      id: 2,
      title: 'Another User Post',
      content: 'This post was created by another user. It shows how collaborative posts work...',
      author: 'other@example.com',
      createdAt: '2023-10-14'
    },
    {
      id: 3,
      title: 'Important Update',
      content: 'This is an important update from the team about upcoming features...',
      author: 'user@example.com',
      createdAt: '2023-10-12'
    }
  ]);

  const filteredPosts = showOnlyMine 
    ? posts.filter(post => post.author === 'user@example.com')
    : posts;

  const togglePost = (id: number): void => {
    setExpandedPostId(expandedPostId === id ? null : id);
  };

  const handleAddPost = (e: React.FormEvent): void => {
    e.preventDefault();
    
    // Get current date in YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const createdAt = `${year}-${month}-${day}`;

    const newPost: Post = {
      id: posts.length + 1,
      title,
      content,
      author: 'user@example.com',
      createdAt
    };
    
    setPosts([newPost, ...posts]);
    setTitle('');
    setContent('');
    setActiveTab('home');
  };

  const handleAddComment = (postId: number) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) return;
  
    const date = new Date().toISOString().split("T")[0];
  
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...(post.comments ?? []),
                {
                  id: Date.now(),
                  text: commentText,
                  author: 'user@example.com',
                  createdAt: date,
                },
              ],
            }
          : post
      )
    );
  
    setNewComment(prev => ({ ...prev, [postId]: "" }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'add-post':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Post</h1>
            <form onSubmit={handleAddPost}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  id="content"
                  rows={4}
                  value={content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        );
      
      default: // 'home'
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">All Posts</h1>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOnlyMine}
                  onChange={() => setShowOnlyMine(!showOnlyMine)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Show only my posts</span>
              </label>
            </div>
  
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <div key={post.id} className="bg-white shadow overflow-hidden rounded-lg">
                  <button
                    onClick={() => togglePost(post.id)}
                    className="w-full text-left px-4 py-5 sm:px-6"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
                      <span className="text-sm text-gray-500">By {post.author}</span>
                    </div>
                  </button>
  
                  {/* Post expanded view with comments */}
                  {expandedPostId === post.id && (
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-4">
                      <p className="text-gray-700">{post.content}</p>
                      <p className="text-sm text-gray-500">Posted on {post.createdAt}</p>
  
                      {/* Comments Section */}
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Comments</h4>
                        <ul className="space-y-2">
                          {(post.comments ?? []).map(comment => (
                            <li key={comment.id} className="text-sm text-gray-800">
                              <span className="font-medium">{comment.author}</span>: {comment.text}
                              <div className="text-xs text-gray-500">{comment.createdAt}</div>
                            </li>
                          ))}
                        </ul>
  
                        {/* Comment Input */}
                        <div className="mt-3">
                          <textarea
                            rows={2}
                            value={newComment[post.id] ?? ''}
                            onChange={(e) =>
                              setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))
                            }
                            className="w-full p-2 border rounded mb-2"
                            placeholder="Add a comment..."
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Submit Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('add-post')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Post
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">user@example.com</span>
            <button 
              onClick={() => signout()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}