import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string | null;
  image_url: string | null;
  created_at: string;
}

const ChatPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !bookingId) {
      navigate('/');
      return;
    }
    loadBookingAndMessages();
  }, [user, bookingId]);

  const loadBookingAndMessages = async () => {
    if (!user || !bookingId) return;

    // Get booking info
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      navigate('/');
      return;
    }

    // Determine the other party
    const { data: worker } = await supabase.from('workers').select('user_id, name').eq('id', booking.worker_id).single();
    const { data: customer } = await supabase.from('customers').select('user_id, name').eq('id', booking.customer_id).single();

    if (worker && customer) {
      if (user.id === worker.user_id) {
        setOtherName(customer.name);
        setOtherUserId(customer.user_id);
      } else {
        setOtherName(worker.name);
        setOtherUserId(worker.user_id);
      }
    }

    // Fetch existing messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    setMessages((msgs as Message[]) || []);
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  };

  // Realtime subscription
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        setTimeout(scrollToBottom, 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !user || !otherUserId || !bookingId) return;

    setSending(true);
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      booking_id: bookingId,
      message_text: newMsg.trim(),
    } as any);
    setNewMsg('');
    setSending(false);
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h2 className="font-heading font-semibold text-foreground">{otherName || 'Chat'}</h2>
            <p className="text-xs text-muted-foreground">Booking conversation</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_id === user.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i < 20 ? i * 0.02 : 0 }}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {msg.message_text && <p>{msg.message_text}</p>}
                    {msg.image_url && <img src={msg.image_url} alt="" className="mt-2 rounded-lg max-w-full" />}
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-card flex gap-2">
          <input
            type="text"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !newMsg.trim()}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
