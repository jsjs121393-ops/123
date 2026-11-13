import { useEffect, useState } from "react";
import { Link, Route, Switch, useLocation, useParams } from "wouter";

// ⚠️ 관리자 비밀번호 (반드시 바꾸세요). 프런트 코드에 들어 있어서 보안용은 아니에요.
const ADMIN_PASSWORD = "nepties1234";

type Course = { id: string; title: string; desc: string; date: string; capacity: number };
type Application = { id: string; courseId: string; name: string; nation: string; contact: string; createdAt: string };
type SurveyAnswer = { id: string; courseId: string; ratings: number[]; comment: string; createdAt: string };

const KEYS = { courses: "nep_courses", apps: "nep_apps", answers: "nep_answers" };
const EMBLEM = "/assets/nephtys-emblem.png";
const LOGO_FULL = "/assets/nephtys-logo.png";
const SLOGAN = "국제사회의 평화·번영·정의를 위해";

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
:root{color-scheme:light}
body{margin:0;font-family:'Noto Sans KR',system-ui,sans-serif;background:#f0eceb;color:#1a1816;word-break:keep-all}
a{color:inherit;text-decoration:none}
.wrap{max-width:1280px;margin:0 auto;padding:0 16px}
.nav{background:#fbf9f8;color:#1a1816;border-bottom:1px solid #d8d0cb;position:sticky;top:0;z-index:10}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;gap:18px;padding-top:14px;padding-bottom:14px}
.nav b{font-family:'Noto Serif KR',serif;font-size:18px;font-weight:900;letter-spacing:-.04em;display:flex;align-items:center;gap:10px;white-space:nowrap}
.nav b:before{content:"";display:block;width:38px;height:38px;background:url('/assets/nephtys-emblem.png') center/contain no-repeat}
.nav-links{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.nav a{font-size:14px;padding:8px 10px;border-bottom:2px solid transparent;transition:.2s}
.nav a:hover,.nav a.active{color:#9a7424;border-bottom-color:#9a7424}
.page{min-height:calc(100vh - 72px)}
.content{max-width:1280px;margin:0 auto;padding:58px 16px 80px}
.card{background:#fbf9f8;border:1px solid #d8d0cb;border-radius:5px;padding:24px;margin-bottom:16px;box-shadow:0 8px 24px rgba(19,18,17,.05)}
.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;padding:24px 0 52px}
.hero-copy{padding:10px 0}.eyebrow{font-size:11px;letter-spacing:.28em;color:#9a7424;font-weight:700}
.hero h1{font-family:'Noto Serif KR',serif;font-size:clamp(38px,5vw,68px);line-height:1.14;font-weight:900;letter-spacing:-.06em;margin:18px 0 0}
.hero h1 em{font-style:normal;color:#9a7424}.hero p{font-size:18px;line-height:1.8;max-width:590px;margin:24px 0;color:#5f5853}
.hero-art{display:flex;justify-content:center;position:relative}.hero-art:before{content:"";position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% 52%,rgba(21,20,19,.07) 0deg .6deg,transparent .6deg 7.5deg);-webkit-mask-image:radial-gradient(circle at 50% 52%,#000 0%,transparent 68%);mask-image:radial-gradient(circle at 50% 52%,#000 0%,transparent 68%)}
.hero-art img{position:relative;max-height:380px;width:auto;max-width:100%}
h1,h2,h3{font-family:'Noto Serif KR',serif;letter-spacing:-.04em}h1{font-size:38px;font-weight:900;margin:0 0 24px}h2{font-size:28px;font-weight:900;margin:0 0 14px}h3{font-size:20px;margin:0 0 8px}
p{line-height:1.7;margin:6px 0}.muted{color:#6d6560;font-size:13px}
.section-title{display:flex;align-items:end;justify-content:space-between;border-top:1px solid #131211;padding-top:18px;margin-top:18px}.section-title small{color:#9a7424;letter-spacing:.24em;font-weight:700;font-size:11px}
label{display:block;font-size:14px;font-weight:600;margin:12px 0 4px}input,select,textarea{width:100%;padding:11px;border:1px solid #cfc6c0;border-radius:4px;font:inherit;background:#fff}textarea{min-height:90px}
button,.btn{display:inline-block;background:#151413;color:#f6f2f0;border:0;border-radius:3px;padding:11px 17px;font:inherit;cursor:pointer;margin-top:12px}.btn.sub{background:#e8e2df;color:#2a2725}.btn.red{background:#b3261e}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.course-list{border-top:1px solid #131211}.course-row{display:block;padding:20px 0;border-bottom:1px solid #d8d0cb}.course-row:hover{background:rgba(233,220,184,.18)}
.rate{display:flex;gap:6px}.rate label{margin:0;display:flex;align-items:center;gap:3px;font-weight:400}.rate input{width:auto}.bar{background:#ebe6e3;border-radius:4px;height:10px;overflow:hidden;margin:3px 0}.bar i{display:block;height:100%;background:#9a7424}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #d8d0cb;vertical-align:top}.ok{color:#287447;font-weight:600}
.steps{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #131211;margin-top:18px}.step{padding:20px 18px;border-left:1px solid #d8d0cb}.step:first-child{border-left:0;padding-left:0}.step-num{font-family:'Noto Serif KR',serif;font-size:32px;color:#9a7424;font-weight:900}
.footer{background:#151413;color:#e9e3df;margin-top:30px}.footer .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:28px;padding-bottom:28px}.footer-brand{display:flex;align-items:center;gap:12px}.footer-brand img{width:48px;height:48px;background:#f0eceb;padding:3px;border-radius:50%}
@media(max-width:760px){.nav .wrap{align-items:flex-start;flex-wrap:wrap}.nav b{flex-basis:100%;font-size:20px}.nav-links{gap:0}.nav a{font-size:14px;padding:6px 8px}.content{padding-top:36px}.hero{grid-template-columns:1fr;gap:14px;padding-bottom:34px}.hero-art{order:-1}.hero-art img{max-height:250px}.hero h1{font-size:43px}.hero p{font-size:16px}.steps{grid-template-columns:1fr}.step{border-left:0;border-top:1px solid #d8d0cb;padding:16px 0}.step:first-child{border-top:0}.footer .wrap{align-items:flex-start;flex-direction:column}}
`;
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{css}</style>
      <div className="page">
        <header className="nav">
          <div className="wrap">
            <Link href="/"><b>네프티스 연합 교육처</b></Link>
            <nav className="nav-links" aria-label="주요 메뉴">
              <Link href="/">홈</Link><Link href="/courses">교육 신청</Link><Link href="/survey">설문</Link><Link href="/stats">통계</Link><Link href="/admin">관리자</Link>
            </nav>
          </div>
        </header>
        <main className="content">{children}</main>
        <footer className="footer"><div className="wrap"><div className="footer-brand"><img src={EMBLEM} alt="" /><div><b>네프티스 연합 교육처</b><div className="muted">{SLOGAN}</div></div></div><span className="muted">EST. 2024</span></div></footer>
      </div>
    </>
  );
}

function Home() {
  const [courses] = useStore<Course[]>(KEYS.courses, DEFAULT_COURSES);
  const open = courses.slice(0, 3);
  return (
    <Layout>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow">NEPHTHYS UNION · EDUCATION BUREAU</div><h1>배움으로 세우는<br/>연합의 <em>질서</em></h1><p>네프티스 연합 교육처의 교육 신청, 이수 후 설문, 결과 통계를 한곳에서 진행합니다.</p><div className="row"><Link href="/courses" className="btn">교육 신청하기</Link><Link href="/survey" className="btn sub">이수 설문 참여</Link><Link href="/stats" className="btn sub">결과 통계 보기</Link></div></div>
        <div className="hero-art"><img src={LOGO_FULL} alt="네프티스 연합 엠블럼" /></div>
      </section>
      <section><div className="section-title"><div><small>{open.length ? "NOW ENROLLING" : "COURSES"}</small><h2>{open.length ? "지금 신청할 수 있는 교육" : "교육 안내"}</h2></div><Link href="/courses" className="muted">전체 보기</Link></div><div className="course-list">{open.map(c=><Link className="course-row" key={c.id} href={`/courses/${c.id}`}><h3>{c.title}</h3><p>{c.desc}</p><span className="muted">일정: {c.date} · 정원 {c.capacity}명</span></Link>)}</div></section>
      <section style={{marginTop:48}}><h2>이용 절차</h2><ol className="steps"><li className="step"><div className="step-num">01</div><h3>교육 신청</h3><p className="muted">모집 중인 교육을 확인하고 신청서를 제출합니다.</p></li><li className="step"><div className="step-num">02</div><h3>이수 후 설문</h3><p className="muted">교육 종료 후 설문에 참여합니다.</p></li><li className="step"><div className="step-num">03</div><h3>결과 통계</h3><p className="muted">응답 결과를 통계로 확인합니다.</p></li></ol></section>
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
