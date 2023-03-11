import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

const AttempContainer = ({ question, isStudent }) => {
  const router = useRouter();
  const { p_number } = router.query;
  const [givenmarks, setGivenmarks] = useState(question.marksobtained);
  const [changed, setChanged] = useState(false);
  const markQuestion = async () => {
    const updatedExam = await axios.post("/api/paper/marking/mark_question", {
      ssa_id: p_number + question.sq_id,
      marksobtained: givenmarks,
    });
    if (updatedExam.status === 200) {
      console.log("Question marked successfully");
    }
  };
  return (
    <div className="flex flex-col justify-between pt-0">
      <div className="text-2xl mb-2">
        <p>{question.questionnumber + ". " + question.question}</p>
      </div>
      {!question.children ? (
        <div className="px-4 py-2 bg-blue-400 rounded-lg space-y-2 flex flex-col">
          <label className="text-white mb-2">
            Answer
            {!question.long_question && (
              <span className="text-gray-200 text-sm">
                {" "}
                (Max 50 characters)
              </span>
            )}
          </label>
          <textarea
            className="border border-gray-300 bg-white rounded-md p-2 w-full"
            disabled
            placeholder={question.answer}
            rows={question.long_question ? 10 : 2}
          />
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center">
              <input
                className="h-6 w-16 mr-3 rounded-md bg-white accent-blue-600 mt-1 ring-0 focus:outline-none p-2 border text-xs border-gray-300 appearance-none"
                type="number"
                value={changed ? givenmarks : question.marksobtained}
                step={0.1}
                onChange={(e) => {
                  setChanged(true);
                  setGivenmarks(Number(e.target.value));
                }}
                max={question.marks}
                min={0}
                disabled={isStudent}
              />
              <span className="font-bold text-sm">/ {question.marks}</span>
            </div>
            {!isStudent && (
              <button
                className="bg-green-800 hover:bg-green-700 text-white py-1 px-2 rounded"
                onClick={markQuestion}
              >
                Mark
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-blue-400 rounded-lg p-4">
          {question.children.map((child) => (
            <AttempContainer
              key={child.sq_id}
              question={child}
              isStudent={isStudent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AttempContainer;
