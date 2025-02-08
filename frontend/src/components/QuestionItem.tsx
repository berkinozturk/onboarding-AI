import React, { useEffect } from 'react';

const QuestionItem = () => {
  const onAnswer = (value: any) => {
    console.log('QuestionItem - onAnswer called with value:', value);
    completeQuestion(question.id, value);
  };

  useEffect(() => {
    console.log('QuestionItem - Current answer:', answer);
    console.log('QuestionItem - Current user:', user);
  }, [answer, user]);

  return (
    // Rest of the component code
  );
};

export default QuestionItem; 
