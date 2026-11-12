import { useEffect, useState } from "react";
import { Link, Route, Switch, useLocation, useParams } from "wouter";

// ⚠️ 관리자 비밀번호 (반드시 바꾸세요). 프런트 코드에 들어 있어서 보안용은 아니에요.
const ADMIN_PASSWORD = "nepties1234";

type Course = { id: string; title: string; desc: string; date: string; capacity: number };
type Application = { id: string; courseId: string; name: string; nation: string; contact: string; createdAt: string };
type SurveyAnswer = { id: string; courseId: string; ratings: number[]; comment: string; createdAt: string };

const KEYS = { courses: "nep_courses", apps: "nep_apps", answers: "nep_answers" };

const DEFAULT_COURSES: Course[] = [
  { id: "sample", title: "신입 기초 교육", desc: "네프티스 연합 소개와 기본 활동 안내", date: "추후 공지", capacity: 30 },
];

const QUESTIONS = [
  "교육 내용이 이해하기 쉬웠다",
  "교육 진행 방식이 적절했다",
  "교육 시간과 분량이 적당했다",
  "교육 자료가 도움이 되었다",
  "다른 사람에게 이 교육을 추천하고 싶다",
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback));
  const set = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  return [value, set] as const;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const isAdmin = () => sessionStorage.getItem("nep_admin") === "1";

function useAdminGuard() {
  const [, navigate] = useLocation();
  const ok = isAdmin();
  useEffect(() => {
    if (!ok) navigate("/admin/login");
  }, [ok]);
  return ok;
}

const css = `
*{box-sizing:border-box}
body{margin:0;font-family:'Noto Sans KR',sans-serif;background:#f8fafc;color:#1e293b}
a{color:inherit;text-decoration:none}
.wrap{max-width:720px;margin:0 auto;padding:16px}
.nav{background:#1e3a5f;color:#fff}
.nav .wrap{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.nav b{font-family:'Noto Serif KR',serif;font-size:17px;margin-right:auto}
.nav a{font-size:14px;opacity:.9}
.card{background:#fff;border-radius:12px;padding:18px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{font-family:'Noto Serif KR',serif;font-size:22px;margin:8px 0 14px}
h2{font-size:17px;margin:0 0 8px}
p{line-height:1.6;margin:6px 0}
.muted{color:#64748b;font-size:13px}
label{display:block;font-size:14px;font-weight:500;margin:12px 0 4px}
input,select,textarea{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font:inherit;background:#fff}
textarea{min-height:80px}
button,.btn{display:inline-block;background:#1e3a5f;color:#fff;border:0;border-radius:8px;padding:10px 16px;font:inherit;cursor:pointer;margin-top:12px}
.btn.sub{background:#e2e8f0;color:#1e293b}
.btn.red{background:#dc2626}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.rate{display:flex;gap:6px}
.rate label{margin:0;display:flex;align-items:center;gap:3px;font-weight:400}
.rate input{width:auto}
.bar{background:#e2e8f0;border-radius:4px;height:10px;overflow:hidden;margin:3px 0}
.bar i{display:block;height:100%;background:#2563eb}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #e2e8f0;vertical-align:top}
.ok{color:#15803d;font-weight:500}
`;

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{css}</style>
      <div className="nav">
        <div className="wrap">
          <b>네프티스 연합 교육처</b>
          <Link href="/">홈</Link>
          <Link href="/courses">교육 신청</Link>
          <Link href="/survey">설문</Link>
          <Link href="/stats">통계</Link>
          <Link href="/admin">관리자</Link>
        </div>
      </div>
      <div className="wrap">{children}</div>
    </>
  );
}

function Home() {
  return (
    <Layout>
      <h1>네프티스 연합 교육처</h1>
      <div className="card">
        <p>교육 신청부터 이수 후 설문, 결과 통계까지 한곳에서.</p>
        <div className="row">
          <Link href="/courses" className="btn">교육 신청하기</Link>
          <Link href="/survey" className="btn sub">설문 참여하기</Link>
          <Link href="/stats" className="btn sub">통계 보기</Link>
        </div>
      </div>
    </Layout>
  );
}

function Courses() {
  const [courses] = useStore<Course[]>(KEYS.courses, DEFAULT_COURSES);
  return (
    <Layout>
      <h1>교육 목록</h1>
      {courses.length === 0 && <div className="card muted">등록된 교육이 없습니다.</div>}
      {courses.map((c) => (
        <Link key={c.id} href={`/courses/${c.id}`}>
          <div className="card">
            <h2>{c.title}</h2>
            <p>{c.desc}</p>
            <p className="muted">일정: {c.date} · 정원 {c.capacity}명</p>
          </div>
        </Link>
      ))}
    </Layout>
  );
}

function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [courses] = useStore<Course[]>(KEYS.courses, DEFAULT_COURSES);
  const [apps, setApps] = useStore<Application[]>(KEYS.apps, []);
  const [form, setForm] = useState({ name: "", nation: "", contact: "" });
  const [done, setDone] = useState(false);
  const course = courses.find((c) => c.id === id);

  if (!course) {
    return (
      <Layout>
        <div className="card">교육을 찾을 수 없습니다. <Link href="/courses">목록으로</Link></div>
      </Layout>
    );
  }

  const count = apps.filter((a) => a.courseId === course.id).length;
  const full = count >= course.capacity;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) return;
    setApps([...apps, { id: uid(), courseId: course.id, ...form, createdAt: new Date().toISOString() }]);
    setDone(true);
  };

  return (
    <Layout>
      <h1>{course.title}</h1>
      <div className="card">
        <p>{course.desc}</p>
        <p className="muted">일정: {course.date} · 신청 {count}/{course.capacity}명</p>
      </div>
      <div className="card">
        <h2>교육 신청</h2>
        {done ? (
          <p className="ok">신청이 완료되었습니다.</p>
        ) : full ? (
          <p className="muted">정원이 마감되었습니다.</p>
        ) : (
          <form onSubmit={submit}>
            <label>이름(닉네임)</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label>소속 국가</label>
            <input value={form.nation} onChange={(e) => setForm({ ...form, nation: e.target.value })} />
            <label>연락처 (디스코드 등)</label>
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
            <button type="submit">신청하기</button>
          </form>
        )}
      </div>
    </Layout>
  );
}

function Survey() {
  const [courses] = useStore<Course[]>(KEYS.courses, DEFAULT_COURSES);
  const [answers, setAnswers] = useStore<SurveyAnswer[]>(KEYS.answers, []);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [ratings, setRatings] = useState<number[]>(QUESTIONS.map(() => 0));
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || ratings.some((r) => r === 0)) {
      alert("모든 문항에 답해 주세요.");
      return;
    }
    setAnswers([...answers, { id: uid(), courseId, ratings, comment, createdAt: new Date().toISOString() }]);
    setDone(true);
  };

  return (
    <Layout>
      <h1>교육 후 설문</h1>
      {done ? (
        <div className="card ok">설문에 참여해 주셔서 감사합니다.</div>
      ) : (
        <form className="card" onSubmit={submit}>
          <label>수강한 교육</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {QUESTIONS.map((q, i) => (
            <div key={q}>
              <label>{i + 1}. {q}</label>
              <div className="rate">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n}>
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={ratings[i] === n}
                      onChange={() => setRatings(ratings.map((r, j) => (j === i ? n : r)))}
                    />
                    {n}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <p className="muted">1 = 매우 아니다, 5 = 매우 그렇다</p>
          <label>건의사항 (선택)</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
          <button type="submit">제출하기</button>
        </form>
      )}
    </Layout>
  );
}

function Stats() {
  const [courses] = useStore<Course[]>(KEYS.courses, DEFAULT_COURSES);
  const [answers] = useStore<SurveyAnswer[]>(KEYS.answers, []);
  const [courseId, setCourseId] = useState("all");
  const list = courseId === "all" ? answers : answers.filter((a) => a.courseId === courseId);

  return (
    <Layout>
      <h1>설문 통계</h1>
      <div className="card">
        <label>교육 선택</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="all">전체</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <p className="muted">응답 {list.length}건</p>
      </div>
      {list.length === 0 ? (
        <div className="card muted">아직 응답이 없습니다.</div>
      ) : (
        QUESTIONS.map((q, i) => {
          const vals = list.map((a) => a.ratings[i]);
          const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
          return (
            <div className="card" key={q}>
              <h2>{q}</h2>
              <p>평균 <b>{avg.toFixed(2)}</b> / 5</p>
              {[5, 4, 3, 2, 1].map((n) => {
                const c = vals.filter((v) => v === n).length;
                return (
                  <div key={n}>
                    <span className="muted">{n}점 ({c})</span>
                    <div className="bar"><i style={{ width: `${(c / vals.length) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </Layout>
  );
}

function AdminLogin() {
  const [, navigate] = useLocation();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("nep_admin", "1");
      navigate("/admin");
    } else {
      setErr(true);
    }
  };

  return (
    <Layout>
      <h1>관리자 로그인</h1>
      <form className="card" onSubmit={submit}>
        <label>비밀번호</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p style={{ color: "#dc2626" }}>비밀번호가 틀렸습니다.</p>}
        <button type="submit">로그인</button>
      </form>
    </Layout>
  );
}

function Admin() {
  const ok = useAdminGuard();
  const [, navigate] = useLocation();
  const [courses, setCourses] = useStore<Course[]>(KEYS.courses, DEFAULT_COURSES);
  const [apps, setApps] = useStore<Application[]>(KEYS.apps, []);
  const [form, setForm] = useState({ title: "", desc: "", date: "", capacity: 30 });

  if (!ok) return null;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCourses([...courses, { id: uid(), ...form }]);
    setForm({ title: "", desc: "", date: "", capacity: 30 });
  };

  const titleOf = (id: string) => courses.find((c) => c.id === id)?.title ?? "(삭제된 교육)";

  return (
    <Layout>
      <h1>교육 관리</h1>
      <div className="row">
        <Link href="/admin/survey" className="btn sub">설문 응답 보기</Link>
        <button
          className="btn sub"
          onClick={() => {
            sessionStorage.removeItem("nep_admin");
            navigate("/admin/login");
          }}
        >
          로그아웃
        </button>
      </div>

      <form className="card" onSubmit={add} style={{ marginTop: 12 }}>
        <h2>교육 추가</h2>
        <label>제목</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <label>설명</label>
        <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        <label>일정</label>
        <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <label>정원</label>
        <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 1 })} />
        <button type="submit">추가</button>
      </form>

      <div className="card">
        <h2>등록된 교육</h2>
        {courses.map((c) => (
          <div key={c.id} className="row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
            <span>{c.title}</span>
            <button
              className="btn red"
              style={{ margin: 0 }}
              onClick={() => confirm("삭제할까요?") && setCourses(courses.filter((x) => x.id !== c.id))}
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <h2>신청 내역 ({apps.length})</h2>
        <table>
          <thead>
            <tr><th>교육</th><th>이름</th><th>국가</th><th>연락처</th><th></th></tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{titleOf(a.courseId)}</td>
                <td>{a.name}</td>
                <td>{a.nation}</td>
                <td>{a.contact}</td>
                <td>
                  <button className="btn red" style={{ margin: 0, padding: "4px 8px" }} onClick={() => setApps(apps.filter((x) => x.id !== a.id))}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

function AdminSurvey() {
  const ok = useAdminGuard();
  const [courses] = useStore<Course[]>(KEYS.courses, DEFAULT_COURSES);
  const [answers, setAnswers] = useStore<SurveyAnswer[]>(KEYS.answers, []);

  if (!ok) return null;

  const titleOf = (id: string) => courses.find((c) => c.id === id)?.title ?? "(삭제된 교육)";

  return (
    <Layout>
      <h1>설문 응답</h1>
      <Link href="/admin" className="btn sub">← 교육 관리</Link>
      {answers.length === 0 && <div className="card muted" style={{ marginTop: 12 }}>응답이 없습니다.</div>}
      {answers.map((a) => (
        <div className="card" key={a.id} style={{ marginTop: 12 }}>
          <h2>{titleOf(a.courseId)}</h2>
          <p className="muted">{new Date(a.createdAt).toLocaleString("ko-KR")}</p>
          <p>점수: {a.ratings.join(" / ")}</p>
          {a.comment && <p>“{a.comment}”</p>}
          <button className="btn red" onClick={() => setAnswers(answers.filter((x) => x.id !== a.id))}>삭제</button>
        </div>
      ))}
    </Layout>
  );
}

function NotFound() {
  return (
    <Layout>
      <div className="card">
        <h2>페이지를 찾을 수 없습니다</h2>
        <Link href="/" className="btn">홈으로</Link>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/survey" component={Survey} />
      <Route path="/stats" component={Stats} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/survey" component={AdminSurvey} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
  }

