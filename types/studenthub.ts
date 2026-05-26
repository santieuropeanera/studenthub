export type UserRole = "student" | "teacher" | "admin";

export type School = {
  id: string;
  name: string;
  country: string;
};

export type Group = {
  id: string;
  schoolId: string;
  name: string;
  arrivalDate?: string;
  departureDate?: string;
};

export type AppUser = {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone?: string;
  schoolId?: string;
  groupId?: string;
};

export type InternshipPlacement = {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  workingHours: string;
  sourceTab?: "work placements";
};

export type Accommodation = {
  id: string;
  name: string;
  address: string;
  emergencyPhone: string;
  mapsUrl: string;
  hospitalMedicalCenterId: string;
  sourceTab?: "accommodation";
};

export type HospitalMedicalCenter = {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  sourceTab?: "hospitals";
};

export type StudentProfile = {
  userId: string;
  dateOfBirth?: string;
  nationality?: string;
  mobilityCode?: string;
  emergencyContact?: string;
  internshipPlacementId: string;
  accommodationId: string;
};

export type StudentCatalogSelection = {
  studentId: string;
  internshipPlacementId: string;
  accommodationId: string;
};

export type TeacherProfile = {
  userId: string;
  schoolId: string;
  groupId: string;
};

export type ScheduleType =
  | "activity"
  | "meeting"
  | "transport"
  | "internship"
  | "free time"
  | "important notice";

export type ScheduleItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  mapsUrl?: string;
  type: ScheduleType;
  groupIds: string[];
  createdBy: string;
};

export type SyncedScheduleItem = {
  id: string;
  groupName: string;
  title: string;
  date: string;
  time: string;
  notes?: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl?: string;
  targetGroupIds?: string[];
};

export type SharedPost = {
  id: string;
  groupId: string;
  authorName: string;
  body: string;
  imageUrl?: string;
  createdAt: string;
  comments: SharedPostComment[];
};

export type SharedPostComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type Report = {
  id: string;
  title: string;
  date: string;
  author: string;
  category: string;
  status: "open" | "in progress" | "closed";
  description: string;
  relatedStudentId?: string;
  relatedGroupId?: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  groupIds?: string[];
  createdAt: string;
};
