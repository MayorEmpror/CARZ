// ============================================================================
// data.ts — MOCKED data. Swap each export out for real fetches / a socket
// connection / server actions.
// ============================================================================

import {
  ThumbsUp,
  ThumbsDown,
  PartyPopper,
  Heart,
  Smile,
  Frown,
  Reply,
  Pencil,
  Pin,
  Copy,
  Settings,
  Forward,
  Trash2,
} from "lucide-react";
import type { Conversation, Message, Member } from "./types";

// TODO(backend): fetch from GET /api/conversations
export const CONVERSATIONS: Conversation[] = [
  { id: "c1", name: "Adam Patric", avatar: "https://i.pravatar.cc/80?img=12", time: "16:25", lastMessage: "Typing", status: "typing", unreadCount: 2 },
  { id: "c2", name: "Andrey Valeri", avatar: "https://i.pravatar.cc/80?img=13", time: "15:30", lastMessage: "Voice message (0:35)", status: "voice" },
  { id: "c3", name: "Ux and Ui team", avatar: "https://i.pravatar.cc/80?img=14", time: "14:50", lastMessage: "Recording a voice mes...", status: "voice", active: true },
  { id: "c4", name: "Ralp Devidson", avatar: "https://i.pravatar.cc/80?img=15", time: "13:10", lastMessage: "Typing", status: "typing", unreadCount: 3 },
  { id: "c5", name: "Brain Volunter", avatar: "https://i.pravatar.cc/80?img=16", time: "11:35", lastMessage: "You:Coooollll 💪 🙌 🔥", status: "sent" },
  { id: "c6", name: "Developer group", avatar: "https://i.pravatar.cc/80?img=17", time: "10:30", lastMessage: "Recording a voice mes...", status: "voice" },
  { id: "c7", name: "Friendly", avatar: "https://i.pravatar.cc/80?img=18", time: "09:25", lastMessage: "The deadline is ....", status: "attachment" },
  { id: "c8", name: "James Brother", avatar: "https://i.pravatar.cc/80?img=19", time: "08:45", lastMessage: "You:Where are you? 🔥", status: "sent" },
  { id: "c9", name: "Relatives", avatar: "https://i.pravatar.cc/80?img=20", time: "07:25", lastMessage: "The deadline is ....", status: "location" },
  { id: "c10", name: "Murad", avatar: "https://i.pravatar.cc/80?img=21", time: "02:10", lastMessage: "You: What is the pro...", status: "sent" },
];

// TODO(backend): fetch from GET /api/stories
export const STORIES = [
  { id: "s1", name: "James", avatar: "https://i.pravatar.cc/80?img=32" },
  { id: "s2", name: "Brain", avatar: "https://i.pravatar.cc/80?img=33" },
  { id: "s3", name: "Antony", avatar: "https://i.pravatar.cc/80?img=34" },
  { id: "s4", name: "Ad", avatar: "https://i.pravatar.cc/80?img=35" },
];

// TODO(backend): fetch from GET /api/conversations/:id/messages
export const MESSAGES: Message[] = [
  {
    id: "m1",
    type: "text",
    senderName: "Ralph Edwards",
    senderAvatar: "https://i.pravatar.cc/80?img=51",
    time: "21 min ago",
    isOwn: false,
    text: "Hey, fellas! I think we can share part of our Design system with Dribble community. What do you think?",
    reactions: [
      { emoji: "👍", count: 3 },
      { emoji: "❤️", count: 5 },
      { emoji: "🔥", count: 1 },
    ],
  },
  {
    id: "m2",
    type: "text",
    senderName: "Jenny Wilson",
    senderAvatar: "https://i.pravatar.cc/80?img=52",
    time: "15 min ago",
    isOwn: true,
    text: "Hi! I think this is brilliant idea 😍 Do you have any specific components you want to share?",
    reactions: [
      { emoji: "👍", count: 4 },
      { emoji: "❤️", count: 5 },
      { emoji: "🔥", count: 2 },
    ],
  },
  {
    id: "m3",
    type: "link-share",
    senderName: "Elvin Arifov",
    senderAvatar: "https://i.pravatar.cc/80?img=53",
    time: "10 min ago",
    isOwn: false,
    url: "https://dribble.com/shots/travel/145842",
    siteName: "Dribble",
    title: "Travel app ui/ux design",
    description:
      "Hello, this is a complete ui/ux design of a mobile travel app. This design was done in figma, and all illustrations are designed from either figma or Adobe Illustrator...",
    images: [
      "https://picsum.photos/seed/travel1/200/300",
      "https://picsum.photos/seed/travel2/200/300",
      "https://picsum.photos/seed/travel3/200/300",
    ],
    reactions: [
      { emoji: "👍", count: 7 },
      { emoji: "❤️", count: 8 },
      { emoji: "🔥", count: 4 },
    ],
  },
];

// TODO(backend): fetch from GET /api/conversations/:id
export const GROUP_INFO = {
  name: "Ux and Ui team",
  avatar: "https://i.pravatar.cc/80?img=14",
  memberCount: 26,
  description:
    "A UX team is a group of professionals who aim to make a product's user experience as rewarding and delightful as it can be.",
  filesCount: 350,
  linksCount: 140,
};

// TODO(backend): fetch from GET /api/conversations/:id/members
export const MEMBERS: Member[] = [
  { id: "u1", name: "Jenny", avatar: "https://i.pravatar.cc/80?img=52", role: "Admin" },
  { id: "u2", name: "Adillu", avatar: "https://i.pravatar.cc/80?img=54", role: "Ux/Ui" },
  { id: "u3", name: "Barcley", avatar: "https://i.pravatar.cc/80?img=55", role: "3d designer" },
];

// TODO(backend): fetch from GET /api/conversations/:id/media
export const MEDIA_IMAGES = [
  "https://picsum.photos/seed/media1/200/200",
  "https://picsum.photos/seed/media2/200/200",
  "https://picsum.photos/seed/media3/200/200",
  "https://picsum.photos/seed/media4/200/200",
  "https://picsum.photos/seed/media5/200/200",
];
export const MEDIA_TOTAL_COUNT = 156; // used to render the "+150" overflow tile

export const REACTION_EMOJIS = [
  { icon: ThumbsUp, value: "👍" },
  { icon: ThumbsDown, value: "👎" },
  { icon: PartyPopper, value: "🙌" },
  { icon: Heart, value: "❤️" },
  { icon: Smile, value: "😍" },
  { icon: Frown, value: "😢" },
];

export const CONTEXT_MENU_ACTIONS = [
  { key: "reply", label: "Reply", icon: Reply },
  { key: "edit", label: "Edit", icon: Pencil },
  { key: "pin", label: "Pin", icon: Pin },
  { key: "copy", label: "Copy", icon: Copy },
  { key: "setting", label: "Setting", icon: Settings },
  { key: "forward", label: "Forward", icon: Forward },
  { key: "delete", label: "Delete", icon: Trash2, danger: true },
];