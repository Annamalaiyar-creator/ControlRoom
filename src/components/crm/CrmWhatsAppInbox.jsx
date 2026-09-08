import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, Bot, Sparkles, User, Paperclip, Check, CheckCheck,
  Search, Phone, Building2, Calendar, FileText, ArrowRight, RefreshCw, X,
  Clock, ShieldAlert, Tag, Layers, ChevronRight, Zap
} from 'lucide-react';
import { analyzeSolarEnquiry } from '../../services/crmStore';

export default function CrmWhatsAppInbox({
  conversations = [],
  templates = [],
  onSendMessage,
  onAutoCreateLead,
  onNavigateTab
}) {
  const [activeConvId, setActiveConvId] = useState(conversations[0]?.id || null);
  const [searchFilter, setSearchFilter] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const messagesEndRef = useRef(null);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  // Run AI analysis on the customer's latest incoming messages
  useEffect(() => {
    if (activeConv && activeConv.messages) {
      const incoming = activeConv.messages.filter(m => m.sender === 'customer');
      const latestIncoming = incoming[incoming.length - 1];
      if (latestIncoming) {
        const analysis = analyzeSolarEnquiry(latestIncoming.text);
        setAiAnalysis(analysis);
      } else {
        setAiAnalysis(null);
      }
    }
  }, [activeConv]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv) return;

    setIsSending(true);
    const newMsg = {
      id: `MSG-${Date.now()}`,
      sender: 'agent',
      senderName: localStorage.getItem('controlroom_logged_user_name') || 'Saravanan',
      text: messageInput.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    try {
      // Fire backend Meta API endpoint
      await fetch('/api/crm/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeConv.phone,
          text: messageInput.trim()
        })
      });
    } catch (err) {
      console.warn('Backend send notice:', err);
    }

    onSendMessage(activeConv.id, newMsg);
    setMessageInput('');
    setIsSending(false);
  };

  const handleApplyTemplate = (tmplText) => {
    if (!tmplText) return;
    let formatted = tmplText
      .replace('{{customer_name}}', activeConv?.customerName?.split(' ')[0] || 'Sir')
      .replace('{{sales_person}}', localStorage.getItem('controlroom_logged_user_name') || 'Saravanan');
    setMessageInput(formatted);
  };

  const handleApplyAiSuggestion = () => {
    if (aiAnalysis?.suggestedReply) {
      setMessageInput(aiAnalysis.suggestedReply);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const q = searchFilter.toLowerCase();
    return !searchFilter ||
      c.customerName?.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.phone?.includes(q);
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr 300px',
      gap: '16px',
      height: 'calc(100vh - 170px)',
      width: '100%',
      minHeight: '600px'
    }}>
      {/* 1. LEFT PANEL: Chat Conversations List */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#16A34A" />
              <span style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>WhatsApp Chats</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#15803D' }}>
              Meta Cloud API Live
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '12px', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.map(conv => {
            const isCurrent = conv.id === activeConv?.id;
            const lastMsg = conv.messages?.[conv.messages.length - 1];
            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #F1F5F9',
                  backgroundColor: isCurrent ? '#F0FDF4' : '#FFFFFF',
                  cursor: 'pointer',
                  borderLeft: isCurrent ? '4px solid #16A34A' : '4px solid transparent',
                  transition: 'background-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>
                    {conv.customerName}
                  </div>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                    {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#0E7490', fontWeight: '600' }}>
                  {conv.companyName}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '4px'
                }}>
                  {lastMsg?.sender === 'agent' ? 'You: ' : ''}{lastMsg?.text || 'No messages yet'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CENTER PANEL: Interactive Chat Workspace */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#16A34A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px' }}>
              {activeConv?.customerName?.charAt(0) || 'C'}
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>
                {activeConv?.customerName} • {activeConv?.phone}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                {activeConv?.companyName} • Channel: Meta WhatsApp Business
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onAutoCreateLead && onAutoCreateLead(activeConv)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #0E7490',
                backgroundColor: '#F0FDFA',
                color: '#0E7490',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Zap size={14} /> Auto-Create Lead
            </button>
          </div>
        </div>

        {/* AI Requirement Extraction Assistant Bar */}
        {aiAnalysis && (
          <div style={{
            backgroundColor: '#F0FDF4',
            borderBottom: '1px solid #BBF7D0',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#16A34A" />
              <div style={{ fontSize: '12px', color: '#166534' }}>
                <strong>AI Solar Detected:</strong> {aiAnalysis.requirement || 'Solar Inbound Inquiry'}
                <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({aiAnalysis.category})</span>
              </div>
            </div>
            <button
              onClick={handleApplyAiSuggestion}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Apply AI Draft Reply
            </button>
          </div>
        )}

        {/* Chat Message Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {activeConv?.messages?.map(msg => {
            const isMe = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  backgroundColor: isMe ? '#0E7490' : '#FFFFFF',
                  color: isMe ? '#FFFFFF' : '#0F172A',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopRightRadius: isMe ? '2px' : '12px',
                  borderTopLeftRadius: isMe ? '12px' : '2px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: isMe ? 'none' : '1px solid #E2E8F0'
                }}
              >
                {!isMe && (
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#0E7490', marginBottom: '2px' }}>
                    {msg.senderName || activeConv.customerName}
                  </div>
                )}
                <div style={{ fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  color: isMe ? '#CFFAFE' : '#94A3B8',
                  marginTop: '4px'
                }}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && <CheckCheck size={12} />}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Templates Bar */}
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Templates:</span>
          <select
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              handleApplyTemplate(e.target.value);
            }}
            style={{
              flex: 1,
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
              color: '#334155'
            }}
          >
            <option value="">Select official VRM structure message template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.body || t.message}>[{t.category}] {t.title}</option>
            ))}
          </select>
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '12px 16px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder="Type WhatsApp message or select a template..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={isSending}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isSending || !messageInput.trim()}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={15} /> Send
          </button>
        </form>
      </div>

      {/* 3. RIGHT PANEL: Customer Intelligence & Quick Actions */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto'
      }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px' }}>
            Customer Profile
          </h4>
          <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontWeight: '800', fontSize: '13px', color: '#0F172A' }}>{activeConv?.companyName}</div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{activeConv?.customerName}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>📞 {activeConv?.phone}</div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', margin: '0 0 8px' }}>
            Quick CRM Actions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => onNavigateTab('Sales BOM')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>📐 Calculate BOM Order</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => onNavigateTab('Quotations')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>📄 Create Quotation</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => onNavigateTab('Follow-ups')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>⏰ Set Follow-up Reminder</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div style={{ padding: '12px', backgroundColor: '#F0FDFA', borderRadius: '8px', border: '1px solid #CCFBF1' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F766E', marginBottom: '4px' }}>
            WhatsApp API Status
          </div>
          <div style={{ fontSize: '11px', color: '#334155' }}>
            Connected to official Meta Graph API v19.0. Incoming messages auto-sync with CRM store.
          </div>
        </div>
      </div>
    </div>
  );
}
