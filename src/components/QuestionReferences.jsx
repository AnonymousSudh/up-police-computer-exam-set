import { getBuiltInExam } from '../data/exam-library';

const labels = {
  'archived-paper': 'Adapted archived-paper topic',
  'official-training': 'UP Police training-bank topic',
  'reference-practice': 'Reference-based practice',
};

export const QuestionReferences = ({ examId, questionId }) => {
  const libraryExam = getBuiltInExam(examId);
  const question = libraryExam?.questions.find(item => item.id === questionId);
  if (!question?.references) return null;
  return <details className="question-references">
    <summary>{labels[question.evidenceKind]} · Sources</summary>
    {question.evidenceKind === 'archived-paper' && <p>The topic appears in a third-party paper mirror. Its exam date and official answer key have not been verified.</p>}
    <ul>{question.references.map(reference => {
      const source = libraryExam.sources[reference.sourceId];
      return <li key={`${reference.sourceId}-${reference.locator}`}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><span>{reference.locator}</span></li>;
    })}</ul>
  </details>;
};
