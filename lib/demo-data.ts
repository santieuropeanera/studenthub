import { buildMapsSearchUrl } from "@/lib/config";
import type {
  Accommodation,
  Activity,
  AppUser,
  Group,
  HospitalMedicalCenter,
  InternshipPlacement,
  Report,
  ScheduleItem,
  School,
  SharedPost,
  StudentProfile
} from "@/types/studenthub";

export const schools: School[] = [
  { id: "school-north", name: "North Valley VET College", country: "Ireland" },
  { id: "school-alma", name: "ALMA International School", country: "Italy" }
];

export const groups: Group[] = [
  {
    id: "group-malaga-may",
    schoolId: "school-north",
    name: "Malaga May Mobility",
    arrivalDate: "2026-05-18",
    departureDate: "2026-06-14"
  },
  {
    id: "group-culinary-june",
    schoolId: "school-alma",
    name: "Culinary June Mobility",
    arrivalDate: "2026-06-03",
    departureDate: "2026-06-28"
  }
];

export const users: AppUser[] = [
  {
    id: "student-1",
    role: "student",
    fullName: "Emma Walsh",
    email: "emma@studenthub.test",
    phone: "+353 87 000 111",
    schoolId: "school-north",
    groupId: "group-malaga-may"
  },
  {
    id: "student-2",
    role: "student",
    fullName: "Luca Bianchi",
    email: "luca@studenthub.test",
    phone: "+39 320 000 222",
    schoolId: "school-alma",
    groupId: "group-culinary-june"
  },
  {
    id: "teacher-1",
    role: "teacher",
    fullName: "Mary O'Connor",
    email: "teacher@studenthub.test",
    phone: "+353 87 333 444",
    schoolId: "school-north",
    groupId: "group-malaga-may"
  },
  {
    id: "admin-1",
    role: "admin",
    fullName: "European Era Admin",
    email: "admin@studenthub.test"
  }
];

export const internshipPlacements: InternshipPlacement[] = [
  {
    id: "internship-tech",
    name: "Malaga Digital Lab",
    address: "Calle Larios 8, Malaga, Spain",
    mapsUrl: buildMapsSearchUrl("Calle Larios 8, Malaga, Spain"),
    workingHours: "Monday to Friday, 09:00 - 14:00",
    sourceTab: "work placements"
  },
  {
    id: "internship-kitchen",
    name: "Costa Culinary Studio",
    address: "Calle Granada 25, Malaga, Spain",
    mapsUrl: buildMapsSearchUrl("Calle Granada 25, Malaga, Spain"),
    workingHours: "Tuesday to Saturday, 10:00 - 15:00",
    sourceTab: "work placements"
  }
];

export const hospitals: HospitalMedicalCenter[] = [
  {
    id: "hospital-centro",
    name: "Centro de Salud Alameda",
    address: "Av. de Andalucia 5, Malaga, Spain",
    mapsUrl: buildMapsSearchUrl("Av. de Andalucia 5, Malaga, Spain"),
    sourceTab: "hospitals"
  },
  {
    id: "hospital-el-palo",
    name: "Centro de Salud El Palo",
    address: "Calle Salvador Allende 159, Malaga, Spain",
    mapsUrl: buildMapsSearchUrl("Calle Salvador Allende 159, Malaga, Spain"),
    sourceTab: "hospitals"
  }
];

export const accommodations: Accommodation[] = [
  {
    id: "accommodation-centro",
    name: "Student Residence Centro",
    address: "Calle Carreteria 41, Malaga, Spain",
    emergencyPhone: "+34 617 916 957",
    mapsUrl: buildMapsSearchUrl("Calle Carreteria 41, Malaga, Spain"),
    hospitalMedicalCenterId: "hospital-centro",
    sourceTab: "accommodation"
  },
  {
    id: "accommodation-soho",
    name: "Soho Shared Apartment",
    address: "Calle Casas de Campos 12, Malaga, Spain",
    emergencyPhone: "+34 617 916 957",
    mapsUrl: buildMapsSearchUrl("Calle Casas de Campos 12, Malaga, Spain"),
    hospitalMedicalCenterId: "hospital-el-palo",
    sourceTab: "accommodation"
  }
];

export const studentProfiles: StudentProfile[] = [
  {
    userId: "student-1",
    nationality: "Irish",
    mobilityCode: "EE-MAY-001",
    emergencyContact: "Parent: +353 87 999 888",
    internshipPlacementId: "internship-tech",
    accommodationId: "accommodation-centro"
  },
  {
    userId: "student-2",
    nationality: "Italian",
    mobilityCode: "EE-JUN-002",
    emergencyContact: "Parent: +39 320 777 888",
    internshipPlacementId: "internship-kitchen",
    accommodationId: "accommodation-soho"
  }
];

export const scheduleItems: ScheduleItem[] = [
  {
    id: "schedule-welcome",
    title: "Welcome Meeting",
    description: "Orientation with European Era, safety information, and practical questions.",
    date: "2026-05-22",
    startTime: "10:00",
    endTime: "11:30",
    location: "European Era office",
    mapsUrl: buildMapsSearchUrl("Malaga Centro, Spain"),
    type: "meeting",
    groupIds: ["group-malaga-may"],
    createdBy: "admin-1"
  },
  {
    id: "schedule-tour",
    title: "Historic Centre Walk",
    description: "Guided walk through Malaga city centre.",
    date: "2026-05-24",
    startTime: "17:00",
    endTime: "19:00",
    location: "Plaza de la Constitucion",
    mapsUrl: buildMapsSearchUrl("Plaza de la Constitucion, Malaga"),
    type: "activity",
    groupIds: ["group-malaga-may", "group-culinary-june"],
    createdBy: "admin-1"
  }
];

export const activities: Activity[] = [
  {
    id: "activity-kayak",
    title: "Kayak Route",
    date: "2026-05-26",
    time: "16:30",
    location: "Malaga Port",
    description: "A relaxed outdoor activity by the sea with the group.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "activity-museum",
    title: "Picasso Museum Visit",
    date: "2026-05-29",
    time: "11:00",
    location: "Museo Picasso Malaga",
    description: "Cultural visit in the historic centre.",
    imageUrl: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=1200&q=80"
  }
];

export const sharedPosts: SharedPost[] = [
  {
    id: "post-1",
    groupId: "group-malaga-may",
    authorName: "Mary O'Connor",
    body: "First week check-in: please add your favourite photo from Malaga so far.",
    createdAt: "2026-05-21T10:00:00.000Z",
    comments: [{ id: "comment-1", authorName: "Emma Walsh", body: "Done!", createdAt: "2026-05-21T10:20:00.000Z" }]
  }
];

export const reports: Report[] = [
  {
    id: "report-1",
    title: "Accommodation arrival note",
    date: "2026-05-18",
    author: "European Era Admin",
    category: "Accommodation",
    status: "closed",
    relatedGroupId: "group-malaga-may",
    description: "Students arrived safely and received emergency instructions."
  }
];

export function getDemoUser(role: "student" | "teacher" | "admin") {
  return users.find((user) => user.role === role) ?? users[0];
}

export function getStudentBundle(userId: string) {
  const user = users.find((item) => item.id === userId);
  const profile = studentProfiles.find((item) => item.userId === userId);
  const accommodation = accommodations.find((item) => item.id === profile?.accommodationId);

  return {
    user,
    profile,
    school: schools.find((item) => item.id === user?.schoolId),
    group: groups.find((item) => item.id === user?.groupId),
    internship: internshipPlacements.find((item) => item.id === profile?.internshipPlacementId),
    accommodation,
    hospital: hospitals.find((item) => item.id === accommodation?.hospitalMedicalCenterId)
  };
}
