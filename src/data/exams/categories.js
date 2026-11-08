export const EXAM_CATEGORIES = [
  {
    id: 'up-police',
    name: 'UP Police',
    fullName: 'UP Police Recruitment Board (PRPB)',
    tagline: 'Computer Operator, Sub-Inspector & Constable',
    description: 'Targeted mock tests and high-yield computer full-form acronym banks for UP Police Computer Operator Grade-A.',
    icon: 'Shield',
    badge: 'Police Recruitment',
    folder: 'src/data/exams/up-police/',
    accentColor: '#e11d48',
    gradient: 'linear-gradient(135deg, rgba(225, 29, 72, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
    tags: ['Computer Operator', 'Full Forms', 'Hardware & Networking', 'Office Tools'],
  },
  {
    id: 'rrb',
    name: 'RRB Railway',
    fullName: 'Railway Recruitment Board (RRB)',
    tagline: 'RRB NTPC, Group D, ALP & Technician',
    description: 'Bilingual practice sets covering Indian Railways GK, General Science (Physics, Chem, Bio), Math, Reasoning & Railway IT systems.',
    icon: 'Train',
    badge: 'Indian Railways',
    folder: 'src/data/exams/rrb/',
    accentColor: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
    tags: ['RRB NTPC', 'Group D', 'General Awareness', 'General Science', 'Bilingual'],
  },
  {
    id: 'ssc',
    name: 'SSC Exam',
    shortName: 'SSC',
    fullName: 'Staff Selection Commission (SSC)',
    tagline: 'SSC CGL, CHSL, MTS, CPO & GD',
    description: 'Tier-I and Tier-II previous year papers & mock tests with Reasoning, General Awareness, Quantitative Aptitude & English Comprehension.',
    icon: 'Award',
    badge: 'Staff Selection Commission',
    folder: 'src/data/exams/ssc/',
    accentColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)',
    tags: ['SSC CGL', 'Tier I', 'Reasoning', 'Math', 'English', 'Bilingual'],
  },
];

export function getExamCategoryById(categoryId) {
  return EXAM_CATEGORIES.find(cat => cat.id === categoryId) || null;
}
