import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  getPaperDateTime,
  convertDateTimeToStrings,
} from "@/lib/TimeCalculations";
export default function PaperDetails({
  paper: initialPaper,
  isFaculty = false,
  studentId,
  
}) {
  const [paper, setPaper] = useState(initialPaper);
  const [studentStatus, setStudentStatus] = useState({
    status: "Not Attempted",
  });
  const [name, setName] = useState("Loading Name...");

  useEffect(() => {
    setPaper(initialPaper);
  }, [initialPaper]);

  const getStudentDetails = () => {
    axios
      .get(`/api/student/get_by_id`, {
        params: {
          p_number: studentId,
        },
      })
      .then((res) => {
        console.log(res.data);
        setName(res.data.name);
      })
      .catch((err) => {
        console.log(err);
      });

    axios
      .get(`/api/student/paper/get_attempt_status`, {
        params: {
          studentId: studentId,
        },
      })
      .then((res) => {
        if (
          res?.data?.filter((attempt) => attempt.paperId === paper.paper_id)
            .length > 0
        ) {
          setStudentStatus(
            res.data.filter((attempt) => attempt.paperId === paper.paper_id)[0]
          );
        }
      });
  };

  useEffect(() => {
    if (studentId) {
      getStudentDetails();
    }
  }, [studentId, paper]);

  const paperDateTime = getPaperDateTime(paper.date, paper.duration);
  const start =
    convertDateTimeToStrings(paperDateTime.start, false) +
    ", " +
    convertDateTimeToStrings(paperDateTime.start, true);
  const end =
    convertDateTimeToStrings(paperDateTime.end, false) +
    ", " +
    convertDateTimeToStrings(paperDateTime.end, true);

  return (
    <div className="mt-4 mb-10">
      {studentId && (
        <div className="flex flex-col items-center justify-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            {name} - {studentId}
          </h1>
          <h1 className="text-xl font-bold text-gray-800">
            {studentStatus.status}
          </h1>
        </div>
      )}

      <table className="w-full text-lg table-fixed bg-white shadow-lg rounded-lg">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="text-left border px-4 py-2">Course Code</th>
            <td className="border text-center px-4 py-2">{paper.course_code}</td>
          </tr>
          <tr className="bg-blue-900 text-white">
            <th className="text-left border px-4 py-2">Paper</th>
            <td className="border text-center px-4 py-2">{paper.paper_name}</td>
          </tr>
          <tr className="bg-blue-900 text-white">
            <th className="text-left border px-4 py-2">Type</th>
            <td className="border text-center px-4 py-2">{paper.paper_type}</td>
          </tr>
          <tr className="bg-blue-900 text-white">
            <th className="text-left border px-4 py-2">Navigation allowed</th>
            <td className="border text-center px-4 py-2">
              {paper.freeflow ? "Yes" : "No"}
            </td>
          </tr>
          {isFaculty && (
            <>
              <tr className="bg-blue-900 text-white">
                <th className="text-left border px-4 py-2">Review allowed</th>
                <td className="border text-center px-4 py-2">
                  {paper.review ? "Yes" : "No"}
                </td>
              </tr>
            </>
          )}
          <tr className="bg-blue-900 text-white">
            <th className="text-left border px-4 py-2">Duration</th>
            <td className="border text-center px-4 py-2">{paper.duration} Minutes</td>
          </tr>
          <tr className="bg-blue-900 text-white">
            <th className="text-left border px-4 py-2">Live Time</th>
            <td className="border text-center px-4 py-2">
              {studentStatus.timeStarted && studentStatus.timeCompleted
                ? convertDateTimeToStrings(studentStatus.timeStarted, false) +
                  ", " +
                  convertDateTimeToStrings(studentStatus.timeStarted, true)
                : start}
            </td>
          </tr>
          <tr className="bg-blue-900 text-white">
            <th className="text-left border px-4 py-2">End Time</th>
            <td className="border text-center px-4 py-2">
              {studentStatus.timeStarted && studentStatus.timeCompleted
                ? convertDateTimeToStrings(studentStatus.timeCompleted, false) +
                  ", " +
                  convertDateTimeToStrings(studentStatus.timeCompleted, true)
                : end}
            </td>
          </tr>
         
        </thead>
      </table>
    </div>
  );
}
