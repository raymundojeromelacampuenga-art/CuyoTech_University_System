import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api, useFetch } from "./api.js";
import {
  Overview,
  Profile,
  Grades,
  Requests,
  NewRequest,
  Submitted,
  Clearance,
} from "./StudentPortal.jsx";
import { Data, useAct } from "./shared.jsx";

const ROUTES = {
  overview: "overview",
  profile: "profile",
  grades: "grades",
  requests: "requests",
  new: "requests/new",
  submitted: "requests/submitted",
  clearance: "clearance",
};
const useGo = () => {
  const nav = useNavigate();
  return (v) => nav(`/student/${ROUTES[v]}`);
};

export function StudentOverview() {
  const go = useGo();
  const q = useFetch("/student/overview");
  return (
    <Data q={q} view="overview">
      {(d) => (
        <Overview
          go={go}
          requests={d.requests}
          clearance={d.clearance}
          profile={d.profile}
        />
      )}
    </Data>
  );
}
export function StudentProfile() {
  const q = useFetch("/student/profile");
  return (
    <Data q={q} view="profile">
      {(p) => <Profile p={p} />}
    </Data>
  );
}
export function StudentGrades() {
  const q = useFetch("/student/grades");
  return (
    <Data q={q} view="grades">
      {(rows) => <Grades subjects={rows} />}
    </Data>
  );
}
export function StudentRequests() {
  const go = useGo();
  const q = useFetch("/student/requests");
  return (
    <Data q={q} view="requests">
      {(rows) => <Requests requests={rows} go={go} />}
    </Data>
  );
}
export function StudentNewRequest() {
  const go = useGo();
  const nav = useNavigate();
  const act = useAct();
  const submit = async (f) => {
    const r = await act(
      () => api("/student/requests", { method: "POST", body: f }),
      "Request submitted",
    );
    if (r) nav("/student/requests/submitted", { state: { r } });
  };
  return <NewRequest onSubmit={submit} go={go} />;
}
export function StudentSubmitted() {
  const { state } = useLocation();
  const go = useGo();
  if (!state?.r) return <Navigate to="/student/requests" replace />;
  return <Submitted r={state.r} go={go} />;
}
export function StudentClearance() {
  const q = useFetch("/student/clearance");
  return (
    <Data q={q} view="clearance">
      {(rows) => <Clearance data={rows} />}
    </Data>
  );
}
