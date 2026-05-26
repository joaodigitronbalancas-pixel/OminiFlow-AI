export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'SUPERVISOR';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type ChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'webchat';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface Channel {
  id: string;
  companyId: string;
  name: string;
  type: ChannelType;
  status: ConnectionStatus;
  qrCode?: string; // For WhatsApp Baileys/Evolution emulation
  instagramUser?: string;
  facebookPage?: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  companyId: string;
  name: string;
  color: string; // Tailwind bg color class or hex
}

export interface QuickReply {
  id: string;
  companyId: string;
  shortcut: string;
  text: string;
}

export type ConversationStatus = 'open' | 'pending' | 'closed';

export interface Conversation {
  id: string;
  companyId: string;
  channelId: string;
  channel: ChannelType;
  contactName: string;
  contactIdentifier: string; // phone number, username, or session ID
  contactEmail?: string;
  avatar?: string;
  status: ConversationStatus;
  assignedTo?: string; // User ID
  assignedName?: string;
  tags: string[]; // Tag IDs
  aiActive: boolean; // Is Gemini AI Agent responding to this contact?
  updatedAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'client' | 'agent' | 'ai' | 'system';
  senderName?: string;
  text: string;
  timestamp: string;
  mediaUrl?: string;
  mimeType?: string;
}

export interface InternalChatMessage {
  id: string;
  companyId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  text: string;
  timestamp: string;
}

export interface AIConfig {
  companyId: string;
  enabled: boolean;
  model: string;
  systemInstruction: string;
  minConfidence: number;
  handoffKeywords: string[]; // triggers human transfer
  rules: string;
}

export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ReportStats {
  ticketsCount: number;
  openCount: number;
  closedCount: number;
  pendingCount: number;
  averageResponseTimeMinutes: number;
  aiResponseCount: number;
  aiHandoffCount: number;
  slaComplianceRate?: number;
  byChannel: Record<ChannelType, number>;
  byAgent: Record<string, { name: string; count: number; closed: number }>;
  byDay: Array<{ date: string; count: number }>;
}
