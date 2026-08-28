import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { communicationApi } from "../api/communication";
import type { Announcement, UnreadCounts } from "../api/communication";

export const useMessages = () => {
  return useQuery({
    queryKey: ["messages"],
    queryFn: () => communicationApi.getMessages().then((res) => res.data),
  });
};

export const useAnnouncements = (classId?: string) => {
  return useQuery({
    queryKey: ["announcements", classId],
    queryFn: () => communicationApi.getAnnouncements(classId ? { classId } : undefined).then((res) => res.data as Announcement[]),
  });
};

export const useUnreadCounts = () => {
  return useQuery({
    queryKey: ["unread-counts"],
    queryFn: () => communicationApi.getUnreadCounts().then((res) => res.data as UnreadCounts),
    refetchInterval: 60000,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { recipientIds: string[]; content: string }) =>
      communicationApi.sendMessage(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};
