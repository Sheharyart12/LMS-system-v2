import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import DashboardLayout from "@/components/DasboardLayout/DashboardLayout";
import BaseLayout from "@/components/BaseLayout/BaseLayout";
import Loader from "@/components/Loader";
import ObjectivePaper from "@/components/Paper/ObjectivePaper";
import SubjectivePaper from "@/components/Paper/SubjectivePaper";
import Submitted from "@/components/Paper/Submitted";

import SubmitObjectiveModal from "@/components/Paper/SubmitObjectiveModal";
import IeExam from "@/components/CreateIE/IeExam";
import IEContainer from "@/components/Paper/IE/IEContainer";

export default function Paper() {
  const router = useRouter();
  const { paper } = router.query;
  const [paperDetails, setPaperDetails] = useState(null); // paper details
  const [attemptTime, setAttemptTime] = useState(NaN); // time left to attempt the paper
  const session = useSession();
  const [solveObjective, setSolveObjective] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [paperAttempt, setPaperAttempt] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [objectiveSubmitModal, setObjectiveSubmitModal] = useState(false);
  const [score,setScore] = useState(0);
  const [IE, setIE] = useState(null);

  const fetchPaper = async () => {
    // fetch paper details from api
    const res = await axios.get(`/api/paper/${paper}`);
    localStorage.setItem(`paper ${paper}`, JSON.stringify(res.data));
    console.log(res.data)
    setPaperDetails(res.data);

  };
  const getTimeCookie = () => {
    const studentIdCookie = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("studentId="));
  
    if (studentIdCookie && studentIdCookie.includes(`studentId=${session.data.user.id}`)) {
      if (document.cookie.includes(`${paper}-time`)) {
        const timeLeft = document.cookie
          .split(";")
          .filter((item) => item.includes(`${paper}-time`))[0]
          .split("=")[1];
        setAttemptTime(timeLeft);
      } else {
        setAttemptTime(-100);
      }
    } else {
      setAttemptTime(-100);
    }
  };
  
  const fetchAttemptOrCreateAttempt = async () => {
    let getAttempt;
    try {
      getAttempt = await axios.get("/api/student/paper/get_single_attempt", {
        params: {
          p_number: session.data.user.id,
          paper_id: paper,
        },
      });
      setSolveObjective(!getAttempt.data.objectiveSolved);
      setStartTime(getAttempt.data.timeStarted);
      if (getAttempt.data.status === "Attempted") {
        getTimeCookie();
      }
      if (localStorage.getItem(`paper ${paper}`)) {
        setPaperDetails(JSON.parse(localStorage.getItem(`paper ${paper}`)));
      } else {
        fetchPaper();
      }
    } catch (err) {
      console.log(err);
      alert("Something went wrong!");
      router.push("/student");
    }
  };
  const handleSolveObjective = async () => {
    setObjectiveSubmitModal(true);
  };
  const handleSubmitObjective = async () => {
    const isObjective = paperDetails?.subjective_questions?.length === 0;
    //we will send marks by comparing the answers
    const timeCompleted = new Date();
    // get gmt offset in hours, and add that in startTime
    const timeCompletedString = `${timeCompleted
      .getHours()
      .toString()
      .padStart(2, "0")}:${timeCompleted
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    await axios.post("/api/student/paper/update_attempt_status", {
      studentId: session.data.user.id,
      paperId: paper,
      objectiveSolved: true,
      status: isObjective ? "Marked" : "Attempted",
      obtainedMarks: score,
      timeCompleted: timeCompletedString,
    });

    localStorage.removeItem("attempted_questions");

    const localPaper = JSON.parse(localStorage.getItem(`paper ${paper}`));
    localPaper.flags = [];
    localStorage.setItem(`paper ${paper}`, JSON.stringify(localPaper));
    setObjectiveSubmitModal(false);
    setSolveObjective(false);
    isObjective && setSubmitted(true);
  };

  useEffect(() => {
    if (session.status === "authenticated" && paper) {
      if (!paperAttempt) {
        setPaperAttempt(true);
        fetchAttemptOrCreateAttempt();
      }
    }
  }, [session, paper]);

  useEffect(() => {
    if (paperDetails) {
      async function fetchIE() {
      if(paperDetails?.paper_type === "IE"){
        try {
          const res = await axios.get(`/api/faculty/get_ie_files`,{
            params: {
              paperId: paper,
          }
          });
          setIE(res.data);
        }
        catch(err){
          console.log(err);
        }
      }
    }
    fetchIE();
    }
  }, [paperDetails]);

  const clearPaperFromLocal = () => {
    localStorage.removeItem(`paper ${paper}`);
    localStorage.removeItem(`attempted_questions`);
  };
  console.log(paperDetails?.subjective_questions)
  const updateStatus = () => {
    //update spa status to Attempted
    const isObjective = paperDetails?.subjective_questions?.length === 0;

    const timeCompleted = new Date();
    // get gmt offset in hours, and add that in startTime
    const timeCompletedString = `${timeCompleted
      .getHours()
      .toString()
      .padStart(2, "0")}:${timeCompleted
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    axios
      .post(`/api/student/paper/update_attempt_status`, {
        studentId: session.data.user.id,
        paperId: paper,
        status: isObjective ? "Marked" : "Submitted",
        obtainedMarks: score,
        timeCompleted: timeCompletedString,
      })
      .then((res) => {
        console.log("updated attempt status ", res.data);
      })
      .catch((err) => {
        console.log("error updating attempt status", err);
      });
  };

  useEffect(() => {
    if (!paperDetails) {
      // If paper details are not available and still loading
      const timeout = setTimeout(() => {
        // Reload the page after 10 seconds
        window.location.reload();
      }, 10000);

      return () => {
        // Cleanup the timeout when component unmounts or when paper details are fetched
        clearTimeout(timeout);
      };
    }
  }, [paperDetails]);
  console.log(paperDetails,"agaga")
  useEffect(() => {
    if (attemptTime === -100 && paperDetails) {
      setAttemptTime(paperDetails.duration * 60);
      return;
    }
    if (attemptTime > 0) {
      setTimeout(() => {
        setAttemptTime(attemptTime - 1);
        var now = new Date();
        now.setTime(now.getTime() + 1 * 3600 * 1000);
        document.cookie = `${paper}-time=${attemptTime}; expires=${now.toUTCString()}; path=/`;
        document.cookie = `studentId=${session.data.user.id}; expires=${now.toUTCString()}; path=/`;
      }, 1000);
    } else if (attemptTime <= 0 && attemptTime > -100 && attemptTime !== null) {
      console.log("attempt time is very high ", attemptTime);
      clearPaperFromLocal();
      updateStatus();
      setSubmitted(true);
    }
  }, [attemptTime, paperDetails]);

  if (!paperDetails) {
    return <Loader />;
  }

  return (
    <BaseLayout>
      {objectiveSubmitModal && (
        <SubmitObjectiveModal
          showModal={objectiveSubmitModal}
          setShowModal={setObjectiveSubmitModal}
          handleSubmit={handleSubmitObjective}
          freeFlow={paperDetails.freeflow}
        />
      )}
      <DashboardLayout>
        {!submitted ? (
          paperDetails.paper_type === "IE" ? (
            <IEContainer 
            IeFiles={IE}
            attemptTime={attemptTime}
            startTime={startTime}
            paperId={paper}
            setSubmitted={setSubmitted}
            updateStatus={updateStatus}
             />
          ) :
         paperDetails && paperDetails.objective_questions.length > 0 && solveObjective  ? (
            <ObjectivePaper
              studentId={session?.data?.user.id}
              questions={paperDetails.objective_questions}
              isfreeFlow={paperDetails.freeflow}
              setSolveObjective={handleSolveObjective}
              paper={paper}
              lang={paperDetails.language}
              attemptTime={attemptTime}
              startTime={startTime}
              submit={handleSubmitObjective}
              setScore={setScore}
              score={score}
            />
          ) : (
            <SubjectivePaper
              studentId={session?.data?.user.id}
              submitted={submitted}
              questions={paperDetails.subjective_questions}
              isfreeFlow={paperDetails.freeflow}
              attemptTime={attemptTime}
              paper={paper}
              startTime={startTime}
            />
          )
        ) : (
          <div className="flex justify-between shadow-lg max-w-5xl font-poppins mt-28 mx-20 xl:mx-auto pt-20 pb-10 px-10 gradient rounded-2xl shadow-3xl shadow-black">
            <div className="flex justify-center w-full">
              <Submitted />
            </div>
          </div>
        )}
      </DashboardLayout>
    </BaseLayout>
  );
}
