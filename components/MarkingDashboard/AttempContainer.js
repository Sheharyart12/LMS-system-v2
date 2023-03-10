import React, { useState } from "react";
import axios from "axios";

const AttempContainer = ({ question, answer, marksobtained, ssa_id }) => {
  const [givenmarks, setGivenmarks] = useState(marksobtained);
  const markQuestion = async () => {
    console.log("Marking question: " + ssa_id + " with marks: " + givenmarks);
    const updatedExam = await axios.post("/api/paper/marking/mark_question", {
      ssa_id: ssa_id,
      marksobtained: givenmarks,
    });
    if (updatedExam.status === 200) {
      console.log("Question marked successfully");
    }
  };
  return (
    <div className="flex flex-col justify-between pt-0">
      <div>
        <div className="text-2xl mb-4">
          <p>{question.questionnumber + ". " + question.question}</p>
        </div>
        <div className="p-4 bg-blue-400 rounded-lg space-y-2 flex flex-col">
          <label className="text-white">
            Answer
            {!question.long_question && (
              <span className="text-gray-200 text-sm">
                {" "}
                (Max 50 characters)
              </span>
            )}
          </label>
          <textarea
            className="border border-gray-300 bg-white rounded-md p-2 w-full "
            disabled
            placeholder={answer}
            rows={question.long_question ? 10 : 2}
          />
          <div className="w-full flex justify-end">
            <div>
              <input
                className="h-6 w-16 mr-3 rounded-md bg-white accent-blue-600 mt-1 ring-0 focus:outline-none p-2 border text-xs border-gray-300 appearance-none"
                type="number"
                value={givenmarks}
                onChange={(e) => setGivenmarks(Number(e.target.value))}
                max={question.marks}
                min={0}
              />
              <span className="font-bold text-sm mr-2">
                / <span>{question.marks}</span>
              </span>
              <button
                className="bg-green-800 hover:bg-green-700 text-white py-1 px-2 rounded"
                onClick={markQuestion}
              >
                Mark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttempContainer;
