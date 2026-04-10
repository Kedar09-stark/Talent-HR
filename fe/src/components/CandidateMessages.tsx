import { useState, useEffect, useRef } from 'react';
import { Mail, Send, Search, Inbox, Bot, Calendar, CheckCircle2, Clock, Sparkles, Lightbulb, TrendingUp, ChevronRight, MoreVertical, Eye, UserCheck, Phone, Share2 } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

export default function CandidateMessages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    const attachMessageHandler = () => {
      console.log('[Socket] Attaching message handler, socket.id:', socketInstance.id);
      
      const handleMessage = (data: any) => {
        console.log('[CANDIDATE-MESSAGE-HANDLER] ✓ Message event fired!');
        console.log('[Socket] Message event received:', data);
        const socketConversationId = data.conversationId;
        const currentUsername = localStorage.getItem('username') || '';
        const incomingMessageId = data.messageId;
        
        console.log('[DEBUG] Current user:', currentUsername);
        console.log('[DEBUG] Socket conversation ID:', socketConversationId);
        console.log('[DEBUG] Message sender:', data.sender);
        console.log('[DEBUG] Incoming message ID:', incomingMessageId);
        
        setConversations(prev => {
          const updated = prev.map(conv => {
            const convSocketId = `hr-${conv.id}`;
            if (convSocketId === socketConversationId) {
              const isAlreadyAdded = conv.messages.some(msg => msg.id === incomingMessageId);
              if (isAlreadyAdded) {
                console.log('[DEBUG] Message already added (deduped):', incomingMessageId);
                return conv;
              }
              
              const newMessage = {
                id: incomingMessageId || `${Date.now()}-${Math.random()}`,
                sender: data.sender === currentUsername ? 'candidate' : 'hr',
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              const isFromOtherUser = data.sender !== currentUsername;
              return {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: data.text,
                timestamp: 'Just now',
                unread: isFromOtherUser ? conv.unread + 1 : 0,
              };
            }
            return conv;
          });
          return updated;
        });

        setSelectedConversation(prev => {
          if (!prev) return null;
          const selectedSocketId = `hr-${prev.id}`;
          if (selectedSocketId === socketConversationId) {
            const isAlreadyAdded = prev.messages.some(msg => msg.id === incomingMessageId);
            if (isAlreadyAdded) {
              console.log('[DEBUG] Message already added to selectedConversation (deduped):', incomingMessageId);
              return prev;
            }
            
            return {
              ...prev,
              messages: [...prev.messages, {
                id: incomingMessageId || `${Date.now()}-${Math.random()}`,
                sender: data.sender === currentUsername ? 'candidate' : 'hr',
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }]
            };
          }
          return prev;
        });
      };
      
      socketInstance.on('message', handleMessage);
      console.log('[Socket] Message handler attached');
    };

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
      setSocketConnected(true);
      attachMessageHandler();
      
      // Test connection
      console.log('[Test] Sending test_connection event...');
      socketInstance.emit('test_connection', { test: 'data' });
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setSocketConnected(false);
    });

    socketInstance.on('typing', (data: any) => {
      setTypingUsers(prev => new Set(prev).add(data.sender));
    });

    socketInstance.on('stop_typing', (data: any) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.sender);
        return newSet;
      });
    });

    socketInstance.on('test_response', (data: any) => {
      console.log('[Test] Received test_response:', data);
      console.log('✓ Socket.IO is working correctly!');
    });

    socketInstance.on('error', (error: any) => {
      console.error('[Socket] Error:', error);
    });

    socketInstance.on('reconnect', () => {
      console.log('[Socket] Reconnected');
      setSocketConnected(true);
    });

    socketInstance.on('reconnect_attempt', () => {
      console.log('[Socket] Attempting to reconnect...');
    });

    setSocket(socketInstance);
    
    // If socket is already connected, attach handler immediately
    if (socketInstance.connected) {
      console.log('[Socket] Already connected, attaching handler immediately');
      attachMessageHandler();
    }

    return () => {
      console.log('[Socket] Component unmounting, keeping socket alive');
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  useEffect(() => {
    fetchHRs();
  }, []);

  const fetchHRs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found in localStorage');
        toast.error('You are not logged in. Please log in again.');
        setLoading(false);
        return;
      }
      console.log('Using access token:', token);
      const response = await fetch('http://localhost:8000/chat/api/candidate-hrs/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch HRs:', response.status, errorText);
        throw new Error(`Failed to fetch HRs: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const hrsConversations = data.hrs.map((hr: any) => ({
        id: hr.id,
        name: hr.username,
        type: 'hr',
        role: `Applied: ${hr.job_title}`,
        lastMessage: hr.latest_message?.text || 'No messages yet',
        timestamp: hr.latest_message?.timestamp ? new Date(hr.latest_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        unread: 0,
        isOnline: true,
        messages: [],
      }));

      setConversations(hrsConversations);
    } catch (error) {
      console.error('Error fetching HRs:', error);
      toast.error('Failed to fetch HRs');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (hrId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/chat/api/history/?conversation_id=hr-${hrId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      const currentUser = localStorage.getItem('username') || '';
      return data.messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender === currentUser ? 'candidate' : 'hr',
        text: msg.text,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  };

  const handleSendMessage = () => {
    console.log('[SEND] handleSendMessage called');
    console.log('[SEND] messageText:', messageText);
    console.log('[SEND] selectedConversation:', selectedConversation);
    console.log('[SEND] socket:', socket);
    
    if (!messageText.trim()) {
      console.log('[SEND] ✗ Message is empty');
      toast.error('Please enter a message');
      return;
    }

    if (!selectedConversation) {
      console.log('[SEND] ✗ No conversation selected');
      toast.error('Please select a conversation');
      return;
    }

    if (!socket) {
      console.log('[SEND] ✗ Socket is null/undefined');
      toast.error('Socket connection not established');
      return;
    }

    console.log('[SEND] ✓ All checks passed');
    
    const currentUser = localStorage.getItem('username') || 'Candidate';
    const conversationId = `hr-${selectedConversation.id}`;

    console.log('[DEBUG-SEND] currentUser from localStorage:', currentUser);
    console.log('[DEBUG-SEND] localStorage.username:', localStorage.getItem('username'));
    console.log('[DEBUG-SEND] conversationId:', conversationId);

    const messageId = `${Date.now()}-${Math.random()}`;
    const newMessage = {
      id: messageId,
      sender: 'candidate',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    console.log('[Socket] Emitting send_message event...');
    console.log('[Socket] Payload:', {
      room: conversationId,
      conversationId: conversationId,
      sender: currentUser,
      receiver: selectedConversation.name,
      text: messageText,
      is_ai: false,
      messageId: messageId,
    });
    
    socket.emit('send_message', {
      room: conversationId,
      conversationId: conversationId,
      sender: currentUser,
      receiver: selectedConversation.name,
      text: messageText,
      is_ai: false,
      messageId: messageId,
    });
    console.log('[Socket] ✓ send_message event emitted');

    setSelectedConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
      };
    });

    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: messageText,
              timestamp: 'Just now',
            }
          : conv
      )
    );

    setMessageText('');
    toast.success('Message sent successfully!');
  };

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation({ ...conversation, messages: [] });
    
    if (!socket) {
      console.error('[Socket] Socket is null, cannot join room');
      return;
    }

    const conversationId = `hr-${conversation.id}`;
    console.log('[Socket] Emitting join_room:', { room: conversationId });
    socket.emit('join_room', { room: conversationId });
    console.log('[Socket] join_room emitted');

    const history = await fetchChatHistory(conversation.id);
    setSelectedConversation(prev => {
      if (!prev) return null;
      return { ...prev, messages: history };
    });

    setConversations(conversations.map(conv => 
      conv.id === conversation.id ? { ...conv, unread: 0 } : conv
    ));
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);
  const hrConversations = conversations.filter(c => c.type === 'hr');

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && conv.unread > 0) ||
                         (filterType === 'employers' && conv.type === 'hr');
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 lg:p-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
        <Card className="p-4 border-0 shadow-sm bg-white">
          <p className="text-sm text-gray-600 mb-1">Total Conversations</p>
          <p className="text-2xl lg:text-3xl text-gray-900">{conversations.length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
          <p className="text-sm text-emerald-700 mb-1">Unread Messages</p>
          <p className="text-2xl lg:text-3xl text-emerald-900">{totalUnread}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-white">
          <p className="text-sm text-gray-600 mb-1">Active Chats</p>
          <p className="text-2xl lg:text-3xl text-gray-900">
            {hrConversations.filter(c => c.isOnline).length}
          </p>
        </Card>
        <Card className={`p-4 border-0 shadow-sm border ${socketConnected ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'}`}>
          <p className={`text-sm ${socketConnected ? 'text-green-700' : 'text-red-700'} mb-1`}>Connection</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className={`text-sm ${socketConnected ? 'text-green-900' : 'text-red-900'}`}>{socketConnected ? 'Connected' : 'Disconnected'}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Conversations List - remains the same structure but wraps in flex col */}
        <div className={`lg:col-span-1 h-full ${selectedConversation ? 'hidden lg:block' : 'block'}`}>
          <Card className="border-0 shadow-sm bg-white flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <Button
                  size="sm"
                  onClick={() => setIsComposeDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9 h-10 bg-gray-50 border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className={filterType === 'all' ? 'bg-emerald-600 hover:bg-emerald-700 h-8 text-xs' : 'h-8 text-xs'}
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('unread')}
                  className={filterType === 'unread' ? 'bg-emerald-600 hover:bg-emerald-700 h-8 text-xs' : 'h-8 text-xs'}
                >
                  Unread
                </Button>
                <Button
                  variant={filterType === 'employers' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('employers')}
                  className={filterType === 'employers' ? 'bg-emerald-600 hover:bg-emerald-700 h-8 text-xs' : 'h-8 text-xs'}
                >
                  Employers
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <p className="text-sm text-gray-600 mt-4">Loading HRs...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-600">No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className={`w-11 h-11 ${
                          conversation.type === 'ai-bot' 
                            ? 'bg-gradient-to-br from-emerald-500 to-sky-500' 
                            : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                        }`}>
                          <AvatarFallback className="text-white font-semibold">
                            {conversation.type === 'ai-bot' ? (
                              <Bot className="w-6 h-6" />
                            ) : (
                              conversation.name.substring(0, 2).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">
                                {conversation.name}
                              </h3>
                              {conversation.type === 'ai-bot' && (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-sky-500 text-white border-0 text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">{conversation.role}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-gray-500 mb-1">{conversation.timestamp}</p>
                            {conversation.unread > 0 && (
                              <Badge className="bg-emerald-600 text-white border-0 text-xs">
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{conversation.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Message Thread */}
        <div className={`lg:col-span-2 ${selectedConversation ? 'block' : 'hidden lg:block'}`}>
          {!selectedConversation ? (
            <Card className="border-0 shadow-sm bg-white p-12 text-center h-full">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to view messages</p>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm bg-white flex flex-col h-full">
              {/* Header */}
              <div className="p-3 lg:p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </Button>
                  <div className="relative">
                    <Avatar className={`w-12 h-12 ${
                      selectedConversation.type === 'ai-bot' 
                        ? 'bg-gradient-to-br from-emerald-500 to-sky-500' 
                        : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                    }`}>
                      <AvatarFallback className="text-white font-semibold">
                        {selectedConversation.type === 'ai-bot' ? (
                          <Bot className="w-6 h-6" />
                        ) : (
                          selectedConversation.name.substring(0, 2).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{selectedConversation.name}</h3>
                      {selectedConversation.type === 'ai-bot' && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-sky-500 text-white border-0 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Assistant
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{selectedConversation.role}</p>
                  </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </Button>
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-b">
                          <Eye className="w-4 h-4" />
                          View Profile
                        </button>
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-b">
                          <UserCheck className="w-4 h-4" />
                          {selectedConversation.unread > 0 ? 'Mark as Read' : 'Mark as Unread'}
                        </button>
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-b">
                          <Phone className="w-4 h-4" />
                          Call
                        </button>
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
                          <Share2 className="w-4 h-4" />
                          Share Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SCROLL 2: Messages - Independent scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {selectedConversation.messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${message.sender === 'candidate' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar className={`w-8 h-8 shrink-0 ${
                        message.sender === 'ai' 
                          ? 'bg-gradient-to-br from-emerald-500 to-sky-500'
                          : message.sender === 'candidate'
                          ? 'bg-gradient-to-br from-emerald-600 to-emerald-700'
                          : 'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        <AvatarFallback className="text-white text-xs font-semibold">
                          {message.sender === 'ai' ? (
                            <Bot className="w-4 h-4" />
                          ) : message.sender === 'candidate' ? (
                            'You'
                          ) : (
                            'HR'
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.sender === 'candidate'
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
                              : message.sender === 'ai'
                              ? 'bg-gradient-to-br from-emerald-50 to-sky-50 text-gray-900 border border-emerald-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${message.sender === 'candidate' ? 'text-right' : 'text-left'}`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input - Fixed at bottom */}
              <div className="p-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-3">
                  <Textarea
                    placeholder={`Type your message to ${selectedConversation.name}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={2}
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">New Message</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="recipient">To</Label>
              <Input
                id="recipient"
                placeholder="Enter employer name or select from list..."
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter message subject..."
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                rows={8}
                className="mt-2 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  toast.success('Message sent successfully!');
                  setIsComposeDialogOpen(false);
                }}
                className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsComposeDialogOpen(false)}
                className="flex-1 h-11 border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}