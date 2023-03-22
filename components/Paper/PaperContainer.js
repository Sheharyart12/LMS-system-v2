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
  // const [questions, setQuestions] = useState([]);
  const [student, setStudent] = useState(null);
  // const [currentQuestion, setCurrentQuestion] = useState(0);
  // const [paperDetails, setPaperDetails] = useState({});
  // const [objectiveCount, setObjectiveCount] = useState(0);
  // const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  // useEffect(() => {
  //   if (paper) {
  //     let papers = JSON.parse(localStorage.getItem("papers") || "{}");
  //     if (papers[paper]?.current) {
  //       console.log("setting current", papers[paper].current);
  //       setCurrentQuestion(papers[paper].current);
  //     }
  //   }
  // }, [paper]);

  useEffect(() => () => {
    if (session) {
      const timeToSess = (new Date() - startOfPage) / 1000;
      console.log(
        "Time to session in its own use effect is",
        timeToSess,
        "\nSession is",
        session
      );
    }
    if (session.status === "authenticated") {
      // console.log("session is ", session);
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

  // const setCurrentAndLocal = (newValue) => {
  //   let papers = JSON.parse(localStorage.getItem("papers") || "{}");

  //   setCurrentQuestion(newValue);
  //   papers[paper].current = newValue;
  //   localStorage.setItem("papers", JSON.stringify(papers));
  // };

  useEffect(() => {
    const useEffectTimeEnter = (new Date() - startOfPage) / 1000;
    console.log(
      "Iteration number: ",
      count + 1,
      "\nTime to enter useEffect: ",
      useEffectTimeEnter.toFixed(3),
      "seconds\n Paper is: ",
      paper,
      "\nStudent is: ",
      student
    );

    setCount(count + 1);

    if (paper) {
      const timeToGetpaper = (new Date() - startOfPage) / 1000;
      console.log("time to get paper", timeToGetpaper);
    }

    if (session) {
      const timeToAuthenticate = (new Date() - startOfPage) / 1000;
      console.log("time to authenticate", timeToAuthenticate);
    }

    if (student && paper) {
      // get paper here and if paper is live, only then set questions
      // let papers = JSON.parse(localStorage.getItem("papers") || "{}");

      // if (papers[paper]) {
      // console.log(
      //   "paper exists in local storage, getting from there",
      //   papers[paper]
      // );
      // // paper exists
      // setQuestions([
      //   ...(papers[paper].objectiveQuestions || []),
      //   ...(papers[paper].subjectiveQuestions || []),
      // ]);
      // setLoading(false);
      // setObjectiveCount(papers[paper].objectiveCount || 0);
      // setFlags(papers[paper].flags || []);
      // setPaperDetails(papers[paper]);
      // } else {
      // do below logic
      // console.log(
      //   "paper does not exist in local storage, getting from server"
      // );
      //update spa status to Attempted
      // axios
      //   .post(`/api/student/paper/update_attempt_status`, {
      //     studentId: session.user.id,
      //     paperId: paper,
      //     status: "Attempted",
      //   })
      //   .then((res) => {
      //     console.log("updated attempt status ", res.data);
      //   })
      //   .catch((err) => {
      //     console.log("error updating attempt status", err);
      //   });

      // get paper details

      const apiStartTime = new Date();
      const reachedApi = (apiStartTime - startOfPage) / 1000;

      console.log(`Time taken to reach api: ${reachedApi} seconds`);
      axios
        .get(`/api/paper/${paper}`)
        .then((res) => {
          // subtract time here from startTime to get time taken in seconds
          const endTime = new Date();
          const timeDiffInSeconds = (endTime - apiStartTime) / 1000;
          const useEffectTime = (endTime - startOfPage) / 1000;

          console.log(
            `Time taken to fetch paper details: ${timeDiffInSeconds} seconds`
          );
          console.log(`Time from start to end: ${useEffectTime} seconds`);

          console.log("paper details from server", res.data);
          // push the paper id in papers index array
          // const currentPaper = res.data;
          // // if paper is live get paper
          // if (currentPaper) {
          //   papers[paper] = currentPaper;
          //   localStorage.setItem("papers", JSON.stringify(papers));
          //   setPaperDetails(res.data);

          //   // get objective questions
          //   axios
          //     .get(`/api/student/paper/oq/${paper}`)
          //     .then((res) => {
          //       const randomizedQuestions = shuffleArray(res.data);
          //       // set objective questions in array and local current, both in value of the paper_id key
          //       papers[paper].objectiveQuestions = randomizedQuestions;
          //       papers[paper].current = 0;
          //       papers[paper].objectiveCount = randomizedQuestions.length;
          //       localStorage.setItem("papers", JSON.stringify(papers));
          //       setObjectiveCount(randomizedQuestions.length);

          //       // if paper is not objective
          //       if (currentPaper.paper_type !== "Objective") {
          //         // get subjective questions
          //         axios
          //           .get(`/api/student/paper/sq/${paper}`)
          //           .then((res) => {
          //             const subjectiveQuestions = res.data.filter(
          //               (question) => !question.parent_sq_id
          //             );
          //             papers[paper].subjectiveQuestions = subjectiveQuestions;
          //             localStorage.setItem("papers", JSON.stringify(papers));
          //             setQuestions(
          //               [
          //                 ...papers[paper].objectiveQuestions,
          //                 ...papers[paper].subjectiveQuestions,
          //               ] || []
          //             );
          //           })
          //           .catch((err) => {
          //             console.log("error ", err.message);
          //           });
          //       }
          //       setLoading(false);
          //     })
          //     .catch((err) => {
          //       console.log("error ", err.message);
          //     });
          // }
          // // if paper is not live, push back to papers list
          // else {
          //   router.push(`/student`);
          // }
        })
        .catch((err) => {
          console.log("error ", err.message);
        });
      // }
    }
  }, [paper, student]);

  // if (loading) {
  //   return <Loader />;
  // }

  return (
    <div className="flex justify-between shadow-lg max-w-5xl font-poppins mt-28 mx-20 xl:mx-auto pt-20 pb-10 px-10 gradient rounded-2xl shadow-3xl shadow-black">
      {/* <div className="w-2/3  rounded-l-2xl">
        {currentQuestion === questions.length ? (
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
        ) : (
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
        )}
      </div>
      <div className="w-1/3 max-w-xs shadow-lg h-fit border-2 border-zinc-100 bg-white p-8 shadow-black">
        <Timer paper={paperDetails} />
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
      </div> */}
    </div>
  );
}
