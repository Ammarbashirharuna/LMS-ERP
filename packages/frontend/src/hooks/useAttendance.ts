import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "../api/attendance";
import type { AttendanceStatus, AttendanceRecord } from "../types/attendance";

export const useAttendance = (filters?: {
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["attendance", filters],
    queryFn: () => attendanceApi.getAll(filters).then((res) => res.data),
  });
};

export const useStudentAttendance = (studentId: string, month?: string) => {
  return useQuery({
    queryKey: ["attendance", "student", studentId, month],
    queryFn: () => attendanceApi.getByStudent(studentId, month).then((res) => res.data as AttendanceRecord[]),
    enabled: !!studentId,
  });
};

export const useRecordAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: string; date: string; status: AttendanceStatus; reasonCode?: string }) =>
      attendanceApi.record(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useBulkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      classId?: string;
      date: string;
      records: Array<{ studentId: string; status: AttendanceStatus; reasonCode?: string }>;
    }) => attendanceApi.bulkRecord(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};
