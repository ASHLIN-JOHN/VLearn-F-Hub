"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Search,
  Send,
  Users,
  Plus,
  BookOpen,
  UserPlus,
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Play,
  Pause,
  Download,
  UserCheck,
  Settings,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  getDocs,
  arrayUnion,
  arrayRemove,
  and,
  or,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  timestamp: string;
  senderName: string;
  type?: "text" | "course_invite" | "study_group" | "voice" | "video_call";
  courseData?: any;
  voiceData?: {
    duration: number;
    audioUrl: string;
    voiceId?: string;
  };
  videoCallData?: {
    duration: number;
    status: "missed" | "completed" | "declined";
  };
}

interface Friend {
  id: string;
  name: string;
  email: string;
  online: boolean;
  lastSeen?: string;
}

interface GroupChat {
  id: string;
  name: string;
  members: string[];
  creator: string;
  createdAt: string;
  lastMessage?: string;
  unreadCount?: number;
}

interface CourseInvitation {
  id: string;
  courseId: string;
  courseName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: "pending" | "accepted" | "declined";
  timestamp: string;
}

interface StudyGroup {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  members: string[];
  creator: string;
  createdAt: string;
}

interface VoiceRecorder {
  isRecording: boolean;
  startTime: number;
  mediaRecorder?: MediaRecorder;
  audioChunks: Blob[];
}

interface VideoCall {
  isActive: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  startTime: number;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export function MessengerModule() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedChat, setSelectedChat] = useState<Friend | GroupChat | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [courseInvitations, setCourseInvitations] = useState<
    CourseInvitation[]
  >([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [selectedCourseForInvite, setSelectedCourseForInvite] =
    useState<any>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [voiceRecorder, setVoiceRecorder] = useState<VoiceRecorder>({
    isRecording: false,
    startTime: 0,
    audioChunks: [],
  });
  const [videoCall, setVideoCall] = useState<VideoCall>({
    isActive: false,
    isVideoEnabled: false,
    isAudioEnabled: false,
    startTime: 0,
  });
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [callDuration, setCallDuration] = useState(0);

  const { user, updateUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      loadAllUsers();
      loadFriends();
      loadCourseInvitations();
      loadStudyGroups();
      loadGroupChats();
    }
  }, [user]);

  useEffect(() => {
    // Clean up previous message listener
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
      messagesUnsubscribeRef.current = null;
    }

    if (selectedChat && user) {
      console.log("Setting up real-time listener for:", selectedChat.name);
      // Small delay to ensure Firebase connection is ready
      const timeoutId = setTimeout(() => {
        messagesUnsubscribeRef.current = loadMessages();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (messagesUnsubscribeRef.current) {
          messagesUnsubscribeRef.current();
          messagesUnsubscribeRef.current = null;
        }
      };
    } else {
      setMessages([]);
    }

    return () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
        messagesUnsubscribeRef.current = null;
      }
    };
  }, [selectedChat, user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Additional effect to handle immediate scrolling after sending
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId === user?.id) {
        // If the last message is from current user, scroll immediately
        scrollToBottom();
      }
    }
  }, [messages, user?.id]);

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (voiceRecorder.isRecording) {
      interval = setInterval(() => {
        setRecordingTime(
          Math.floor((Date.now() - voiceRecorder.startTime) / 1000),
        );
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [voiceRecorder.isRecording, voiceRecorder.startTime]);

  // Video call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (videoCall.isActive) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - videoCall.startTime) / 1000));
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoCall.isActive, videoCall.startTime]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadAllUsers = () => {
    if (!user) return;

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((u: any) => u.id !== user.id);
      setAllUsers(users);
    });

    return () => unsubscribe();
  };

  const loadFriends = () => {
    if (!user?.profile?.friends) return;

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userFriends = user.profile.friends
        .map((friendId: string) => {
          const friend = allUsers.find((u: any) => u.id === friendId);
          return friend
            ? {
                id: friend.id,
                name: friend.name,
                email: friend.email,
                online: Math.random() > 0.5,
                lastSeen: new Date(
                  Date.now() - Math.random() * 24 * 60 * 60 * 1000,
                ).toISOString(),
              }
            : null;
        })
        .filter(Boolean);

      setFriends(userFriends);
    });

    return () => unsubscribe();
  };

  const loadGroupChats = () => {
    if (!user) return;

    const q = query(
      collection(db, "groupChats"),
      where("members", "array-contains", user.id),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userGroups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ||
          doc.data().createdAt,
      })) as GroupChat[];

      setGroupChats(userGroups);
    });

    return () => unsubscribe();
  };

  const loadCourseInvitations = () => {
    if (!user) return;

    const q = query(
      collection(db, "courseInvitations"),
      or(where("toUserId", "==", user.id), where("fromUserId", "==", user.id)),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invitations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp:
          doc.data().timestamp?.toDate?.()?.toISOString() ||
          doc.data().timestamp,
      })) as CourseInvitation[];

      setCourseInvitations(invitations);
    });

    return () => unsubscribe();
  };

  const loadStudyGroups = () => {
    if (!user) return;

    const q = query(
      collection(db, "studyGroups"),
      where("members", "array-contains", user.id),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.()?.toISOString() ||
          doc.data().createdAt,
      })) as StudyGroup[];

      setStudyGroups(groups);
    });

    return () => unsubscribe();
  };

  const createGroupChat = async () => {
    if (!user || !groupName.trim() || selectedMembers.length === 0) return;

    try {
      const newGroupData = {
        name: groupName,
        members: [user.id, ...selectedMembers],
        creator: user.id,
        createdAt: Timestamp.now(),
        unreadCount: 0,
      };

      const docRef = await addDoc(collection(db, "groupChats"), newGroupData);

      setShowCreateGroup(false);
      setGroupName("");
      setSelectedMembers([]);

      // Select the new group
      const newGroup: GroupChat = {
        id: docRef.id,
        ...newGroupData,
        createdAt: new Date().toISOString(),
      };
      setSelectedChat(newGroup);
    } catch (error) {
      console.error("Error creating group chat:", error);
    }
  };

  const addFriend = async (friendId: string) => {
    if (!user) return;

    if (user.profile?.friends?.includes(friendId)) {
      return;
    }

    try {
      // Update current user's friends list
      await updateDoc(doc(db, "users", user.id), {
        "profile.friends": arrayUnion(friendId),
      });

      // Update friend's friends list
      await updateDoc(doc(db, "users", friendId), {
        "profile.friends": arrayUnion(user.id),
      });

      // Update local user state
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          friends: [...(user.profile?.friends || []), friendId],
        },
      };
      updateUser(updatedUser);
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Voice recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/wav")) {
          mimeType = "audio/wav";
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration =
          recordingTime ||
          Math.floor((Date.now() - voiceRecorder.startTime) / 1000);

        if (duration < 1) {
          alert("Recording too short. Please record for at least 1 second.");
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const voiceId = `voice-${Date.now()}`;
        sendVoiceMessage(audioUrl, duration, voiceId);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setVoiceRecorder({
        isRecording: true,
        startTime: Date.now(),
        mediaRecorder,
        audioChunks: [],
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Unable to access microphone. Please check your permissions and try again.",
      );
    }
  };

  const stopVoiceRecording = () => {
    if (voiceRecorder.mediaRecorder && voiceRecorder.isRecording) {
      voiceRecorder.mediaRecorder.stop();
      setVoiceRecorder({
        isRecording: false,
        startTime: 0,
        audioChunks: [],
      });
    }
  };

  const sendVoiceMessage = async (
    audioUrl: string,
    duration: number,
    voiceId: string,
  ) => {
    if (!user || !selectedChat) return;

    try {
      const messageData = {
        content: `🎤 Voice message (${formatDuration(duration)})`,
        senderId: user.id,
        receiverId: "members" in selectedChat ? null : selectedChat.id,
        groupId: "members" in selectedChat ? selectedChat.id : null,
        timestamp: Timestamp.now(),
        senderName: user.name || "Unknown User",
        type: "voice",
        voiceData: {
          duration,
          audioUrl,
          voiceId,
        },
      };

      console.log("Sending voice message:", messageData);

      // Send to Firebase - real-time listener will pick this up immediately
      const docRef = await addDoc(collection(db, "messages"), messageData);
      console.log("Voice message sent successfully with ID:", docRef.id);

      // Force scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Error sending voice message:", error);
      alert("Failed to send voice message. Please try again.");
    }
  };

  const playVoiceMessage = (messageId: string, audioUrl: string) => {
    if (playingVoiceId === messageId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoiceId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        audioRef.current.src = audioUrl;
        audioRef.current.load();

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setPlayingVoiceId(messageId);
            })
            .catch((error) => {
              console.error("Error playing audio:", error);
              setPlayingVoiceId(null);
            });
        }

        audioRef.current.onended = () => {
          setPlayingVoiceId(null);
        };
      }
    }
  };

  const startVideoCall = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Video calling is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setVideoCall({
        isActive: true,
        isVideoEnabled: true,
        isAudioEnabled: true,
        startTime: Date.now(),
        localStream: stream,
      });

      setTimeout(() => {
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch((err) => {
            console.error("Error playing local video:", err);
          });
        }
      }, 100);

      // Send video call notification to Firebase
      if (user && selectedChat && !("members" in selectedChat)) {
        try {
          const messageData = {
            content: `📹 ${user.name} started a video call`,
            senderId: user.id,
            receiverId: selectedChat.id,
            groupId: null,
            timestamp: Timestamp.now(),
            senderName: user.name,
            type: "video_call",
            videoCallData: {
              duration: 0,
              status: "missed",
            },
          };

          await addDoc(collection(db, "messages"), messageData);
        } catch (error) {
          console.error("Error sending video call message:", error);
        }
      }
    } catch (error) {
      console.error("Error accessing camera/microphone:", error);
      alert(
        "Unable to access camera/microphone. Please check your permissions and try again.",
      );
    }
  };

  const endVideoCall = async () => {
    if (videoCall.localStream) {
      videoCall.localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    const duration = Math.floor((Date.now() - videoCall.startTime) / 1000);

    // Send call ended message to Firebase
    if (user && selectedChat && !("members" in selectedChat) && duration > 0) {
      try {
        const messageData = {
          content: `📹 Call ended • Duration: ${formatDuration(duration)}`,
          senderId: user.id,
          receiverId: selectedChat.id,
          groupId: null,
          timestamp: Timestamp.now(),
          senderName: user.name,
          type: "video_call",
          videoCallData: {
            duration: duration,
            status: "completed",
          },
        };

        await addDoc(collection(db, "messages"), messageData);
      } catch (error) {
        console.error("Error sending call ended message:", error);
      }
    }

    setVideoCall({
      isActive: false,
      isVideoEnabled: false,
      isAudioEnabled: false,
      startTime: 0,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (videoCall.localStream) {
      const videoTrack = videoCall.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newVideoState = !videoCall.isVideoEnabled;
        videoTrack.enabled = newVideoState;
        setVideoCall((prev) => ({ ...prev, isVideoEnabled: newVideoState }));
      }
    }
  };

  const toggleAudio = () => {
    if (videoCall.localStream) {
      const audioTrack = videoCall.localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newAudioState = !videoCall.isAudioEnabled;
        audioTrack.enabled = newAudioState;
        setVideoCall((prev) => ({ ...prev, isAudioEnabled: newAudioState }));
      }
    }
  };

  const sendCourseInvitation = async (
    courseId: string,
    courseName: string,
    toUserId: string,
  ) => {
    if (!user) return;

    try {
      // Save invitation to Firebase
      const invitationData = {
        courseId,
        courseName,
        fromUserId: user.id,
        fromUserName: user.name,
        toUserId,
        status: "pending",
        timestamp: Timestamp.now(),
      };

      const invitationRef = await addDoc(
        collection(db, "courseInvitations"),
        invitationData,
      );

      // Send message to Firebase
      const messageData = {
        content: `📚 ${user.name} invited you to study "${courseName}" together!`,
        senderId: user.id,
        receiverId: toUserId,
        groupId: null,
        timestamp: Timestamp.now(),
        senderName: user.name,
        type: "course_invite",
        courseData: { courseId, courseName, invitationId: invitationRef.id },
      };

      await addDoc(collection(db, "messages"), messageData);
    } catch (error) {
      console.error("Error sending course invitation:", error);
    }
  };

  const acceptCourseInvitation = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, "courseInvitations", invitationId), {
        status: "accepted",
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
    }
  };

  const createStudyGroup = async (
    courseId: string,
    courseName: string,
    memberIds: string[],
  ) => {
    if (!user) return;

    try {
      const studyGroupData = {
        name: `${courseName} Study Group`,
        courseId,
        courseName,
        members: [user.id, ...memberIds],
        creator: user.id,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "studyGroups"), studyGroupData);
    } catch (error) {
      console.error("Error creating study group:", error);
    }
  };

  const loadMessages = () => {
    if (!user || !selectedChat) return;

    console.log(
      "Setting up real-time messages listener for:",
      selectedChat.name,
      "User:",
      user.name,
    );

    let q;
    if ("members" in selectedChat) {
      // Group chat messages
      q = query(
        collection(db, "messages"),
        where("groupId", "==", selectedChat.id),
        orderBy("timestamp", "asc"),
      );
    } else {
      // Direct messages - create compound query for both users
      q = query(
        collection(db, "messages"),
        where("groupId", "==", null),
        orderBy("timestamp", "asc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "Real-time snapshot received, docs count:",
          snapshot.docs.length,
        );

        let conversationMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp:
            doc.data().timestamp?.toDate?.()?.toISOString() ||
            doc.data().timestamp,
        })) as Message[];

        console.log("All messages from snapshot:", conversationMessages.length);

        // Filter direct messages to only show messages between current user and selected chat
        if (!("members" in selectedChat)) {
          conversationMessages = conversationMessages.filter((msg: Message) => {
            const isDirectMessage =
              (msg.senderId === user.id &&
                msg.receiverId === selectedChat.id) ||
              (msg.senderId === selectedChat.id && msg.receiverId === user.id);
            return isDirectMessage;
          });
        }

        console.log(
          "Filtered messages for this chat:",
          conversationMessages.length,
        );

        // Sort messages by timestamp to ensure correct order
        conversationMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });

        // Update messages state - this will trigger immediate re-render
        setMessages((prevMessages) => {
          // Force re-render by creating new array reference
          const newMessages = [...conversationMessages];
          console.log(
            "Updating messages state with",
            newMessages.length,
            "messages",
          );
          return newMessages;
        });

        // Auto-scroll to bottom for new messages - multiple attempts for reliability
        requestAnimationFrame(() => {
          scrollToBottom();
          setTimeout(() => scrollToBottom(), 100);
          setTimeout(() => scrollToBottom(), 300);
        });
      },
      (error) => {
        console.error("Error loading messages:", error);
      },
    );

    return unsubscribe;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedChat) return;

    const messageContent = newMessage.trim();

    try {
      const messageData = {
        content: messageContent,
        senderId: user.id,
        receiverId: "members" in selectedChat ? null : selectedChat.id,
        groupId: "members" in selectedChat ? selectedChat.id : null,
        timestamp: Timestamp.now(),
        senderName: user.name || "Unknown User",
        type: "text",
      };

      console.log("Sending message:", messageData);

      // Add optimistic update - show message immediately
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        ...messageData,
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, tempMessage]);

      // Clear input immediately for better UX
      setNewMessage("");

      // Scroll to bottom immediately
      setTimeout(() => scrollToBottom(), 10);

      // Send message to Firebase - this will trigger real-time listener
      const docRef = await addDoc(collection(db, "messages"), messageData);
      console.log("Message sent successfully with ID:", docRef.id);

      // Update group chat last message
      if ("members" in selectedChat) {
        try {
          await updateDoc(doc(db, "groupChats", selectedChat.id), {
            lastMessage: messageContent.slice(0, 50),
            lastMessageTime: Timestamp.now(),
          });
        } catch (updateError) {
          console.error("Error updating group chat:", updateError);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error and restore input
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.id.startsWith("temp-")),
      );
      setNewMessage(messageContent);
      alert("Failed to send message. Please try again.");
    }
  };

  const getUserCourses = () => {
    const localCourses = JSON.parse(
      localStorage.getItem("local-courses") || "[]",
    );
    const savedCourses = JSON.parse(localStorage.getItem("courses") || "[]");
    return [...localCourses, ...savedCourses].filter(
      (c: any) => c.user_id === user?.id,
    );
  };

  const getGroupMemberNames = (memberIds: string[]) => {
    return memberIds
      .filter((id) => id !== user?.id)
      .map((id) => {
        const member = allUsers.find((u: any) => u.id === id);
        return member?.name || "Unknown";
      })
      .join(", ");
  };

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotFriend = !user?.profile?.friends?.includes(u.id);
    return matchesSearch && isNotFriend;
  });

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredGroups = groupChats.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const downloadVoiceMessage = (audioUrl: string, messageId: string) => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `voice-message-${messageId}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages & Study Groups</h1>
        <p className="text-muted-foreground">
          Connect with friends, create group chats, and collaborate with voice &
          video
        </p>
      </div>

      {/* Hidden audio element for voice messages */}
      <audio ref={audioRef} />

      {/* Firebase Status */}

      {/* Course Invitations */}
      {courseInvitations.filter(
        (inv) => inv.toUserId === user?.id && inv.status === "pending",
      ).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {courseInvitations
                .filter(
                  (inv) =>
                    inv.toUserId === user?.id && inv.status === "pending",
                )
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invitation.fromUserName}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited you to study "{invitation.courseName}"
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptCourseInvitation(invitation.id)}
                      >
                        Accept
                      </Button>
                      <Button size="sm" variant="outline">
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Call Modal - Full Screen */}
      {videoCall.isActive && (
        <div
          className="fixed inset-0 bg-black z-[9999] flex flex-col"
          style={{ width: "100vw", height: "100vh" }}
        >
          <div className="flex-1 relative bg-gray-900 overflow-hidden">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  Calling {selectedChat?.name}...
                </h2>
                <p className="text-gray-400">Waiting for them to join</p>
              </div>
            </div>

            <div className="absolute top-6 right-6 w-80 h-60 bg-gray-900 rounded-xl overflow-hidden border-4 border-white/10 shadow-2xl">
              {videoCall.isVideoEnabled && videoCall.localStream ? (
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center">
                  <VideoOff className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-gray-400 text-sm">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                You
              </div>
            </div>

            <div className="absolute top-6 left-6 bg-black/70 text-white px-6 py-3 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold">Connected</span>
                </div>
                <div className="h-4 w-px bg-white/30"></div>
                <span className="font-mono text-lg">
                  {formatDuration(callDuration)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/95 p-8 backdrop-blur-md border-t border-white/10">
            <div className="flex justify-center items-center gap-8">
              <Button
                size="lg"
                variant={videoCall.isAudioEnabled ? "secondary" : "destructive"}
                onClick={toggleAudio}
                className={`rounded-full w-20 h-20 transition-all hover:scale-110 shadow-2xl ${
                  videoCall.isAudioEnabled
                    ? "bg-gray-600 hover:bg-gray-500 text-white border-2 border-white/20"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {videoCall.isAudioEnabled ? (
                  <Mic className="h-8 w-8" />
                ) : (
                  <MicOff className="h-8 w-8" />
                )}
              </Button>

              <Button
                size="lg"
                variant={videoCall.isVideoEnabled ? "secondary" : "destructive"}
                onClick={toggleVideo}
                className={`rounded-full w-20 h-20 transition-all hover:scale-110 shadow-2xl ${
                  videoCall.isVideoEnabled
                    ? "bg-gray-600 hover:bg-gray-500 text-white border-2 border-white/20"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {videoCall.isVideoEnabled ? (
                  <Video className="h-8 w-8" />
                ) : (
                  <VideoOff className="h-8 w-8" />
                )}
              </Button>

              <Button
                size="lg"
                variant="destructive"
                onClick={endVideoCall}
                className="rounded-full w-20 h-20 transition-all hover:scale-110 bg-red-600 hover:bg-red-700 shadow-2xl border-2 border-red-400"
              >
                <PhoneOff className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Friends & Groups List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chats ({friends.length + groupChats.length})
              </CardTitle>
              <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                    <DialogDescription>
                      Create a new group chat with your friends
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Enter group name..."
                      />
                    </div>
                    <div>
                      <Label>Select Members</Label>
                      <ScrollArea className="h-40 border rounded-md p-2">
                        {friends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center space-x-2 py-2"
                          >
                            <Checkbox
                              id={friend.id}
                              checked={selectedMembers.includes(friend.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMembers([
                                    ...selectedMembers,
                                    friend.id,
                                  ]);
                                } else {
                                  setSelectedMembers(
                                    selectedMembers.filter(
                                      (id) => id !== friend.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            <Label htmlFor={friend.id} className="flex-1">
                              {friend.name}
                            </Label>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                    <Button
                      onClick={createGroupChat}
                      disabled={
                        !groupName.trim() || selectedMembers.length === 0
                      }
                      className="w-full"
                    >
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {/* Group Chats */}
                {filteredGroups.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                      Group Chats
                    </h4>
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChat &&
                          "id" in selectedChat &&
                          selectedChat.id === group.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedChat(group)}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{group.name}</div>
                          <p className="text-sm text-muted-foreground">
                            {group.members.length} members
                            {group.lastMessage && ` • ${group.lastMessage}`}
                          </p>
                        </div>
                        {group.unreadCount && group.unreadCount > 0 && (
                          <Badge variant="destructive" className="rounded-full">
                            {group.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Messages */}
                <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                  Direct Messages
                </h4>
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat &&
                      "id" in selectedChat &&
                      selectedChat.id === friend.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedChat(friend)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`/placeholder-user.jpg`} />
                      <AvatarFallback>
                        {friend.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{friend.name}</span>
                        {friend.online && (
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {friend.online ? (
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            Online
                          </span>
                        ) : (
                          `Last seen ${formatTime(friend.lastSeen || "")}`
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add new friends section */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">
                    {searchQuery.trim()
                      ? `Search Results (${filteredUsers.length})`
                      : `Add Friends (${filteredUsers.length} available)`}
                  </h4>
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {searchQuery.trim()
                        ? `No users found matching "${searchQuery}"`
                        : "No new users to add"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.slice(0, 8).map((potentialFriend) => (
                        <div
                          key={potentialFriend.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors border"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm font-medium">
                              {potentialFriend.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {potentialFriend.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {potentialFriend.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addFriend(potentialFriend.id)}
                              className="flex items-center gap-1"
                            >
                              <UserPlus className="h-3 w-3" />
                              Add
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                addFriend(potentialFriend.id);
                                // Auto-select the user for immediate messaging
                                setTimeout(() => {
                                  const newFriend: Friend = {
                                    id: potentialFriend.id,
                                    name: potentialFriend.name,
                                    email: potentialFriend.email,
                                    online: Math.random() > 0.5,
                                    lastSeen: new Date().toISOString(),
                                  };
                                  setSelectedChat(newFriend);
                                }, 500);
                              }}
                              className="flex items-center gap-1"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Message
                            </Button>
                          </div>
                        </div>
                      ))}
                      {filteredUsers.length > 8 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{filteredUsers.length - 8} more users found. Refine
                          your search to see more.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedChat ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {"members" in selectedChat ? (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                    ) : (
                      <Avatar>
                        <AvatarImage src={`/placeholder-user.jpg`} />
                        <AvatarFallback>
                          {selectedChat.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <CardTitle>{selectedChat.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {"members" in selectedChat ? (
                          `${selectedChat.members.length} members: ${getGroupMemberNames(selectedChat.members)}`
                        ) : selectedChat.online ? (
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            Online
                          </span>
                        ) : (
                          `Last seen ${formatTime(selectedChat.lastSeen || "")}`
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {/* Video call only for direct messages */}
                    {!("members" in selectedChat) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={startVideoCall}
                        disabled={videoCall.isActive}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Video Call
                      </Button>
                    )}

                    {/* Course invite only for direct messages */}
                    {!("members" in selectedChat) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const courses = getUserCourses();
                          if (courses.length > 0) {
                            setSelectedCourseForInvite(courses[0]);
                          }
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Invite to Course
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col">
                <ScrollArea className="h-[350px] mb-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {/* Show sender name in group chats */}
                          {"members" in selectedChat &&
                            message.senderId !== user?.id && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {message.senderName}
                              </p>
                            )}

                          {message.type === "course_invite" && (
                            <div className="border-b pb-2 mb-2">
                              <Badge variant="secondary">
                                Course Invitation
                              </Badge>
                            </div>
                          )}

                          {message.type === "voice" && message.voiceData && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={
                                  message.senderId === user?.id
                                    ? "secondary"
                                    : "outline"
                                }
                                onClick={() =>
                                  playVoiceMessage(
                                    message.id,
                                    message.voiceData!.audioUrl,
                                  )
                                }
                              >
                                {playingVoiceId === message.id ? (
                                  <Pause className="h-3 w-3" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                              </Button>
                              <span className="text-sm">
                                {formatDuration(message.voiceData.duration)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  downloadVoiceMessage(
                                    message.voiceData!.audioUrl,
                                    message.id,
                                  )
                                }
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          {message.type === "video_call" &&
                            message.videoCallData && (
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                <span className="text-sm">
                                  {message.videoCallData.status === "completed"
                                    ? `Call ended • ${formatDuration(message.videoCallData.duration)}`
                                    : "Video call"}
                                </span>
                              </div>
                            )}

                          {(!message.type || message.type === "text") && (
                            <p>{message.content}</p>
                          )}

                          {message.courseData &&
                            message.senderId !== user?.id && (
                              <div className="mt-2 pt-2 border-t">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    acceptCourseInvitation(
                                      message.courseData.invitationId,
                                    )
                                  }
                                >
                                  Accept Invitation
                                </Button>
                              </div>
                            )}

                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === user?.id
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  {/* Voice recording button */}
                  <Button
                    size="icon"
                    variant={
                      voiceRecorder.isRecording ? "destructive" : "outline"
                    }
                    onClick={
                      voiceRecorder.isRecording
                        ? stopVoiceRecording
                        : startVoiceRecording
                    }
                    title={
                      voiceRecorder.isRecording
                        ? "Stop recording"
                        : "Record voice message"
                    }
                    className="transition-all hover:scale-105"
                  >
                    {voiceRecorder.isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>

                  <Input
                    placeholder={
                      voiceRecorder.isRecording
                        ? "Recording voice message..."
                        : "Type a message..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1"
                    disabled={voiceRecorder.isRecording}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || voiceRecorder.isRecording}
                    className="transition-all hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {voiceRecorder.isRecording && (
                  <div className="mt-2 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-red-600">
                        <div className="relative">
                          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
                        </div>
                        <span className="font-medium">Recording...</span>
                        <span className="font-mono">
                          {formatDuration(recordingTime)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={stopVoiceRecording}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        Stop & Send
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-red-500">
                      Click "Stop & Send" or the microphone button to send your
                      voice message
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Select a chat to start messaging
                </h3>
                <p className="text-muted-foreground">
                  Choose a friend or group from the list to begin your
                  conversation
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Quick Course Invite Modal */}
      {selectedCourseForInvite &&
        selectedChat &&
        !("members" in selectedChat) && (
          <Card className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Invite to Course</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedCourseForInvite(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <p>
                  Select a course to invite {selectedChat.name} to study
                  together:
                </p>
                <div className="space-y-2">
                  {getUserCourses().map((course) => (
                    <Button
                      key={course.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        sendCourseInvitation(
                          course.id,
                          course.title,
                          selectedChat.id,
                        );
                        setSelectedCourseForInvite(null);
                      }}
                    >
                      <span className="mr-2">{course.icon}</span>
                      {course.title}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
    </div>
  );
}
