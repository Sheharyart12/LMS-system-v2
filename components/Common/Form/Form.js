import React, { useEffect, useState } from "react";
import Input from "./Input";
import axios from "axios";
import { useRouter } from "next/router";
import Spinner from "@/components/Loader/Spinner";
import { useSession } from "next-auth/react";

export default function Form({
  setActive,
  setPaperId,
  examDetails,
  paperType,
  setFreeFlowGlobal,
  setExam,
}) {
  const router = useRouter();
  const session = useSession();
  const level = session?.data?.user?.level;
  const [loading, setLoading] = useState({});
  const [edit, setEdit] = useState(examDetails!==null ? true : false);
  const [copy, setCopy] = useState(examDetails?.is_copy ? true : false);
  const [paperName, setPaperName] = useState("");
  const [paperDuration, setPaperDuration] = useState(
    router.query.is_edit === "true" ? null :180);
  const [weightage, setWeightage] = useState("");
  const [dateOfExam, setDateOfExam] = useState(null);
  const [paperTime, setPaperTime] = useState(
    router.query.is_edit === "true" ? null : "09:00"
  );
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [freeflow, setFreeflow] = useState(true);
  const [review, setReview] = useState(true);

  useEffect(() => {
    console.log(edit,examDetails,"some")
    if (edit) {
      setLoading({
        message: "Loading Exam Details...",
      });
      axios
        .post("/api/faculty/get_exam", {
          paper_id: examDetails?.paper_id,
        })
        .then((res) => {
          setPaperName(res.data.paper_name);
          console.log(res.data);
          setPaperDuration(res.data.duration);
          setWeightage(res.data.weightage);
          setDateOfExam(new Date(res.data.date).toISOString().substr(0, 10));
          setPaperTime(new Date(res.data.date).toISOString().substr(11, 5));
          setFreeflow(res.data.freeflow);
          setFreeFlowGlobal(res.data.freeflow);
          setReview(res.data.review);
          setLoading({});
        })
        .catch((err) => {
          console.log(err);
          setLoading({
            error: "Error in Loading Exam Details.",
          });
        });
    }
    if (copy) {
      // fetch name of all courses
      axios
        .get("/api/admin/course/get_courses")
        .then((res) => {
          setCourses(res.data);
        })
        .catch((err) => {
          console.log("Error in /api/admin/course/get_courses", err);
          setLoading({
            error: "Error in Loading Courses.",
          });
        });
    }
  }, [edit, examDetails, copy]);

  const handlePaperName = (e) => {
    setPaperName(e.target.value);
  };

  const handleReview = (e) => {
    setReview(e.target.checked);
  };

  const handleDuration = (e) => {
    setPaperDuration(parseInt(e.target.value));
  };

  const handleDateOfExam = (e) => {
    setDateOfExam(e.target.value);
  };

  const handleWeightage = (e) => {
    setWeightage(parseInt(e.target.value));
  };

  const handlePaperTime = (e) => {
    setPaperTime(e.target.value);
  };

  const handleFreeflow = (e) => {
    setFreeflow(e.target.checked);
    setFreeFlowGlobal(e.target.checked);
  };

  const formatDate = (examDate, examTime) => {
    const date = new Date(examDate);
    const dateString =
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      date.getDate().toString().padStart(2, "0");
    const timeString = examTime;
    return dateString + "T" + timeString + "Z";
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (paperName === "" || dateOfExam === "" || (copy && !selectedCourse)) {
      alert("Please fill all the fields");
      return;
    }
    setLoading({
      message: edit ? "Updating Paper Details" : "Creating Paper",
    });

    try {
      const res = await axios.post(
        `/api/faculty/paper_creation/${edit ? "edit_paper" : "new_paper"}`,
        {
          paper_id: examDetails ? examDetails.paper_id : null,
          course_code: copy
            ? selectedCourse
            : router.query.course_code
            ? router.query.course_code
            : null,
          paper_name: paperName,
          date: formatDate(dateOfExam, paperTime),
          duration: paperDuration,
          weightage: parseInt(weightage),
          paper_type: paperType,
          freeflow: freeflow,
          review: review,
          language:router.query.language?router.query.language:"English"
        }
      );
      if (res.status === 200) {
        setLoading({});
        setExam((prevExam) => ({
          ...prevExam,
          ...res.data,
        }));
        console.log("paper made ", res.data);

        setPaperId(res.data.paper_id);
        setActive(2);
      }
    } catch (err) {
      console.log(err);
      setLoading({
        error: "Error in Creating Paper",
      });
    }
  };
  useEffect(() => {
    if (Object.keys(router.query).length > 1  && !router.query.language) {
      setEdit(true);
    }
    if (examDetails?.is_copy ? true : false) {
      setCopy(true);
    }
  }, [examDetails]);

  const copyPaper = () => {
    setLoading({
      message: "Copying Paper...",
    });
    axios
      .post("/api/paper/duplicate_paper", {
        id: examDetails.paper_id,
      })
      .then((res) => {
        setLoading({});
        console.log("copied paper", res.data);
        let type;
        switch (res.data.paper_type) {
          case "Objective":
            type = "objective";
            break;
          case "Subjective/Objective":
            type = "subjective";
            break;
          case "Word":
            type = "word";
            break;
          case "IE":
            type = "ie";
          default:
            type = "subjective";
            break;
        }

        router.push({
          pathname: `/faculty/create_exam/${type}`,
          query: {
            paper_id: res.data.paper_id,
            is_edit: true,
            is_copy: true,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        setLoading({
          error: "Error in Copying Paper",
        });
      });
  };
  return (
    <form>
      <Spinner loading={loading} />
      <div className="w-full grid grid-cols-2 pr-10 gap-x-5 mt-10 font-poppins">
        <Input
          text={router.query.language && router.query.language==="urdu"?"Paper Name":"Paper Name"}
          required={true}
          type={"text"}
          placeholder={"Ex: Mid-Term Exam"}
          onChange={handlePaperName}
          value={paperName}
        />
        <Input
          text={"Paper Duration (in minutes)"}
          required={true}
          type={"number"}
          value={paperDuration}
          min={0}
          max={180}
          onChange={handleDuration}
        />

        <Input
          text={"Date of Exam"}
          required={true}
          type={"date"}
          onChange={handleDateOfExam}
          value={dateOfExam}
        />
        <Input
          text={"Weightage"}
          required={false}
          type={"number"}
          min={0}
          placeholder={"Ex: 20%"}
          value={weightage}
          onChange={handleWeightage}
        />

        <Input
          text={"Paper Live Time"}
          required={true}
          type={"time"}
          onChange={handlePaperTime}
          value={paperTime}
        />

        {copy && (
          <div className="w-full font-poppins mt-6">
            <label className="text-primary-black">New Course</label>
            <select
              className="    w-full  border  border-primary-black border-opacity-[0.15] rounded-md mt-2 px-3 py-2 
            focus:border-[#FEC703] focus:outline-none bg-white dateSelectorColor "
              onChange={(e) => {
                setSelectedCourse(e.target.value);
              }}
              value={selectedCourse}
            >
              <option value={""}> Select Course to Copy Exam</option>
              {courses.map((course) => (
                <option key={course.course_code} value={course.course_code}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
            <p className="bg-slate-100 rounded-lg text-red-600 mt-4 px-4 py-2">
              <span className="text-black mr-1">Note: </span>Make sure to
              carefully select the course of this exam as it can not be changed
              later.
            </p>
          </div>
        )}

        <div className="flex items-center gap-x-3 mt-14 ml-2">
          <label className="block">Freeflow?</label>
          <input
            type="checkbox"
            className="accent-slate-100"
            checked={freeflow}
            onChange={handleFreeflow}
          />
        </div>

        <div className="flex items-center gap-x-3 mt-14 ml-2">
          <label className="block">Allow review?</label>
          <input
            type="checkbox"
            className="accent-slate-100"
            checked={review}
            onChange={handleReview}
          />
        </div>
      </div>
      <div className="mt-10 w-full pr-10 flex justify-end gap-x-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="border-2 border-[#FEC703] hover:bg-[#FEAF03] hover:text-white font-medium text-primary-black rounded-lg py-3 px-8"
        >
          Cancel
        </button>
        {level === 5 && !copy && edit && (
          <button
            type="button"
            className="bg-blue-800 hover:bg-blue-700 font-medium text-white rounded-lg py-4 px-8"
            onClick={copyPaper}
          >
            Copy Paper
          </button>
        )}
        <button
          type="submit"
          className="bg-blue-800 hover:bg-blue-700 font-medium text-white rounded-lg py-4 px-8"
          onClick={(e) => submitForm(e)}
        >
          Save and Proceed
        </button>
      </div>
    </form>
  );
}
