import rrbMock1 from './rrb-ntpc-mock-1.json' with { type: 'json' };

export const rrbNtpMock1 = {
  ...rrbMock1,
  category: 'rrb',
};

// As you provide more JSON files for RRB exams, import and add them here:
export const rrbExams = [
  rrbNtpMock1,
];

export default rrbExams;
