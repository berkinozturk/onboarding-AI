  setAnswers(prevAnswers => ({
    ...prevAnswers,
    [questionId]: {
      answer: response.answer.answer,
      timestamp: response.answer.updatedAt,
      userId: response.answer.userId
    }
  })); 