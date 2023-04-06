import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import OQContainer from "./Objective/OQContainer";
import SQContainer from "./Subjective/SQContainer";
import { useSession } from "next-auth/react";
import NavigationGrid from "./NavigationGrid";
import Loader from "../Loader";
import Timer from "./Timer";
import Submitted from "./Submitted";
import IEContainer from "./IE/IEContainer";

/* 
Objective
  localstorage 
  {‌
    Order change
    ‌Same mcq on reload
    ‌Flag mcq
  }

  ‌Timed mcq
  ‌Multiple answers
  ‌Retain answer

Subjective
  localstorage
  {
    ‌Flag question
  }
  ‌Same order
  ‌Child answers
  ‌Retain answer
*/

export default function PaperContainer({ startOfPage }) {
  const session = useSession();
  const router = useRouter();
  const { paper } = router.query;
  const [questions, setQuestions] = useState([]);
  const [student, setStudent] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [paperDetails, setPaperDetails] = useState({});
  const [objectiveCount, setObjectiveCount] = useState(0);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [excelData, setExcelData] = useState([]);
  const [paperStartTime, setPaperStartTime] = useState(null);

  useEffect(() => {
    if (paper) {
      let papers = JSON.parse(localStorage.getItem("papers") || "{}");
      if (papers[paper]?.current) {
        setCurrentQuestion(papers[paper].current);
      }
    }
  }, [paper]);

  useEffect(() => () => {
    if (session.status === "authenticated") {
      setStudent(session.data.user.id);
    }
  });
  [session];

  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  };

  const setCurrentAndLocal = (newValue) => {
    let papers = JSON.parse(localStorage.getItem("papers") || "{}");

    setCurrentQuestion(newValue);
    papers[paper].current = newValue;
    localStorage.setItem("papers", JSON.stringify(papers));
  };

  useEffect(() => {
    setCount(count + 1);

    if (student && paper) {
      // get paper here and if paper is live, only then set questions
      let papers = JSON.parse(localStorage.getItem("papers") || "{}");

      if (papers[paper]) {
        console.log(
          "paper exists in local storage, getting from there",
          papers[paper]
        );
        // paper exists
        setQuestions([
          ...(papers[paper].objectiveQuestions || []),
          ...(papers[paper].subjectiveQuestions || []),
        ]);
        setLoading(false);
        setObjectiveCount(papers[paper].objectiveCount || 0);
        setFlags(papers[paper].flags || []);
        setPaperDetails(papers[paper]);
        setPaperStartTime(papers[paper].startTime);
      } else {
        // do below logic
        console.log(
          "paper does not exist in local storage, getting from server"
        );

        // get paper details
        axios
          .get(`/api/paper/${paper}`)
          .then((res) => {
            // subtract time here from startTime to get time taken in seconds
            console.log("paper details from server", res.data);
            // push the paper id in papers index array
            const currentPaper = res.data;
            // if paper is live get paper
            if (currentPaper) {
              papers[paper] = currentPaper;
              localStorage.setItem("papers", JSON.stringify(papers));
              setPaperDetails(res.data);

              // get objective questions
              axios
                .get(`/api/student/paper/oq/${paper}`)
                .then((res) => {
                  const randomizedQuestions = shuffleArray(res.data);
                  // set objective questions in array and local current, both in value of the paper_id key
                  papers[paper].objectiveQuestions = randomizedQuestions;
                  papers[paper].current = 0;
                  papers[paper].objectiveCount = randomizedQuestions.length;
                  localStorage.setItem("papers", JSON.stringify(papers));
                  setObjectiveCount(randomizedQuestions.length);
                  setLoading(false);
                  setQuestions(papers[paper].objectiveQuestions);
                })
                .catch((err) => {
                  console.log("error ", err.message);
                });

              // if paper is not objective
              if (currentPaper.paper_type !== "Objective") {
                // get subjective questions
                axios
                  .get(`/api/student/paper/sq/${paper}`)
                  .then((res) => {
                    console.log(
                      "time taken to get subjective",
                      (new Date() - startOfPage) / 1000
                    );
                    const subjectiveQuestions = res.data.filter(
                      (question) => !question.parent_sq_id
                    );
                    papers[paper].subjectiveQuestions = subjectiveQuestions;
                    localStorage.setItem("papers", JSON.stringify(papers));
                    setQuestions(
                      [
                        ...papers[paper].objectiveQuestions,
                        ...papers[paper].subjectiveQuestions,
                      ] || []
                    );
                  })
                  .catch((err) => {
                    console.log("error ", err.message);
                  });
              }
              if (currentPaper.paper_type === "IE") {
                axios
                  .get(`/api/faculty/get_ie_files`, {
                    params: {
                      paperId: paper,
                    },
                  })
                  .then((res) => {
                    console.log("time taken to get ie", res.data);

                    // Make second API call using response of first
                    //extract file urls from response
                    console.log("Response from first API call", res.data);
                    //loop through the data array and make a post request for each file url
                    res.data.ie_questions.forEach((file) => {
                      axios
                        .post(`/api/faculty/read_file`, {
                          fileUrl: file.fileUrl,
                        })
                        .then((res) => {
                          console.log(
                            "Response from second API call",
                            res.data
                          );
                          //loop through the res.data and if the data is filled, excelData
                          res.data.forEach((data) => {
                            if (data) {
                              setExcelData((excelData) => [...excelData, data]);
                            }
                          });
                        })
                        .catch((error) => {
                          console.error("Error in second API call", error);
                        });
                    });
                  })
                  .catch((error) => {
                    console.error("Error in first API call", error);
                  });
              }
            }
            // if paper is not live, push back to papers list
            else {
              router.push(`/student`);
            }
          })
          .catch((err) => {
            console.log("error ", err.message);
          });

        //update spa status to Attempted
        const startTime = new Date();
        // get gmt offset in hours, and add that in startTime
        const gmtOffset = new Date().getTimezoneOffset() 
        startTime.setMinutes(startTime.getMinutes() - gmtOffset);

        axios
          .post(`/api/student/paper/update_attempt_status`, {
            studentId: session.data.user.id,
            paperId: paper,
            status: "Attempted",
            timeStarted: startTime.toISOString(),
          })
          .then((res) => {
            console.log("updated attempt status ", res.data);
          })
          .catch((err) => {
            console.log("error updating attempt status", err);
          });
        
      }
    }
  }, [paper, student]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="flex justify-between shadow-lg max-w-5xl font-poppins mt-28 mx-20 xl:mx-auto pt-20 pb-10 px-10 gradient rounded-2xl shadow-3xl shadow-black">
      <div className="w-2/3  rounded-l-2xl">
        {currentQuestion === questions.length &&
        paperDetails.paper_type !== "IE" ? (
          <Submitted />
        ) : paperDetails.paper_type === "Objective" ? (
          <OQContainer
            question={questions[currentQuestion]}
            totalQuestions={questions.length}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentAndLocal}
            freeFlow={paperDetails.freeflow}
            flags={flags || []}
            setFlags={setFlags}
          />
        ) : paperDetails.paper_type === "Subjective/Objective" ? (
          <>
            {currentQuestion < objectiveCount ? (
              <OQContainer
                question={questions[currentQuestion]}
                totalQuestions={questions.length}
                currentQuestion={currentQuestion}
                setCurrentQuestion={setCurrentAndLocal}
                freeFlow={paperDetails.freeflow}
                flags={flags || []}
                setFlags={setFlags}
              />
            ) : (
              <SQContainer
                question={questions[currentQuestion]}
                totalQuestions={questions.length}
                currentQuestion={currentQuestion}
                setCurrentQuestion={setCurrentAndLocal}
                freeFlow={paperDetails.freeflow}
                flags={flags || []}
                setFlags={setFlags}
              />
            )}
          </>
        ) : (
          <IEContainer excelData={excelData} />
        )}
      </div>
      <div className="w-1/3 max-w-xs shadow-lg h-fit border-2 border-zinc-100 bg-white p-8 shadow-black">
        <Timer paper={paperDetails} paperStartTime={paperStartTime} />
        {(paperDetails.freeflow ||
          (paperDetails.paper_type !== "Objective" &&
            currentQuestion >= objectiveCount)) &&
          currentQuestion < questions.length && (
            <NavigationGrid
              totalQuestions={
                paperDetails.freeflow
                  ? questions.length
                  : questions.length - objectiveCount
              }
              currentQuestion={
                paperDetails.freeflow
                  ? currentQuestion
                  : currentQuestion - objectiveCount
              }
              freeFlow={paperDetails.freeflow}
              offset={objectiveCount}
              setCurrentQuestion={setCurrentAndLocal}
              flags={flags || []}
              setFlags={setFlags}
            />
          )}
      </div>
    </div>
  );
}
