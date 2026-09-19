import { readFileSync, writeFileSync } from "node:fs";

const bank = JSON.parse(readFileSync("src/data/questions.json", "utf8"));
if (bank.sections.some((s) => s.title === "HR Interview")) {
  console.log("HR section already present — nothing to do.");
  process.exit(0);
}

// id scheme matches repo sections: (sectionId+1)*1000 + n
const SECTION_ID = 115;
const HR = [
  ["Tell me about yourself.", "Give a 90-second structured pitch: present role and one relevant achievement, then two or three past wins with numbers that map to this job, and close with why this role is the right next step. Keep it confident and specific, never recite your resume line by line. Example: 'I am a data scientist with two years in churn modeling, where I cut churn 12 percent; before that I built the analytics dashboard my college placement cell still uses. I am now looking to apply that in a larger ML product team, which is why this role excites me.'"],
  ["Walk me through your resume.", "Pick a narrative thread, not the whole document: education, then each role with one accomplishment and one skill gained, showing a logical progression toward this job. Spend the most time on what is most relevant to the interviewer's team and end at why this position is the natural next move."],
  ["Why should we hire you?", "Match three specifics of the job description to three proof points you own: a skill with a project, a domain with experience, and a trait with evidence, then add a commitment line about ramping fast. Close with enthusiasm for the team's mission rather than generic 'I am hardworking' claims."],
  ["What are your strengths?", "Choose two technical and one soft strength that the role actually needs, each with a one-line proof: 'I turn messy requirements into working first drafts fast; my last model shipped in three weeks from kickoff.' Avoid cliches without evidence and avoid strengths irrelevant to the job."],
  ["What is your greatest weakness?", "Name a real, non-critical weakness and show the correcting system: 'I used to go deep polishing alone too early; now I share rough work within 48 hours and timebox refinement, which improved my feedback cycles.' Never use humble-brags like 'I work too hard' — interviewers hear those all day."],
  ["Where do you see yourself in five years?", "Show ambition anchored to the path this role sits on: growing from strong individual contributor to owning projects end to end, deepening expertise in the team's domain, maybe mentoring. Keep the focus on growth at this company rather than naming titles, timelines, or aspirations that point away from the job."],
  ["Why do you want to work here?", "Prove you researched them: cite one product, technical blog post, value, or recent development that genuinely interests you, and connect it to your experience and goals. Structure as 'what I admire, what I bring, what I want to learn here.' Generic answers signal mass applications."],
  ["Why are you leaving your current job?", "Stay positive and future-focused: seeking larger scale, new domains, or growth that your current role cannot offer. Never badmouth your employer, manager, or colleagues — the interviewer assumes you will describe them the same way someday. End on what attracts you to this opportunity."],
  ["Tell me about a challenge you faced and how you overcame it.", "Use STAR: a real challenge with stakes, the specific actions you personally took, and a quantified result. Pick a work or project example, not a personal crisis. 'Our model degraded after deployment; I built a monitoring pipeline, found feature drift, retrained with rolling windows, and restored accuracy within a week.'"],
  ["Tell me about a time you failed.", "Choose a real failure with lessons that changed your behavior: 'I shipped a model without checking for data leakage; validation collapsed in production. I now run leakage audits before every release and taught my team the checklist.' Own it fully, skip blame, and show the corrective system you built."],
  ["Describe a conflict with a coworker and how you resolved it.", "Pick a professional disagreement, show you listened first and found common ground: 'My stakeholder wanted a complex model; I showed the accuracy-versus-latency trade-off with data, proposed a phased approach, and we shipped the simple version first.' Emphasize empathy, direct communication, and the shared goal rather than winning."],
  ["Tell me about a time you showed leadership.", "Leadership without a title counts: leading a project, unblocking a stuck team, mentoring a junior, or driving a decision with data. Use STAR and highlight how you aligned people, not just what you delivered."],
  ["Tell me about a time you worked in a team.", "Show collaboration mechanics: how you divided work, communicated progress, handled disagreement, and supported others. Quantify the outcome and credit teammates genuinely — 'we' for success, 'I' for the specific actions you owned."],
  ["How do you handle pressure or tight deadlines?", "Describe a real system, not a platitude: prioritizing by impact, splitting work into milestones, communicating early when scope is at risk, and staying calm. Give one example where this system delivered under a real deadline."],
  ["How do you handle criticism or negative feedback?", "Show you treat feedback as data: listen fully, ask clarifying questions, thank them, and act on it with a concrete example of a change you made. Never get defensive; interviewers are testing coachability, which predicts growth."],
  ["What motivates you?", "Be honest and specific to the role: solving hard problems with data, seeing users benefit from your model, continuous learning. Connect motivation to what the job actually offers daily, so the answer reads as genuine fit rather than rehearsed idealism."],
  ["What is your expected salary?", "Deflect gracefully first if you can: ask for their budgeted range. If pressed, give a researched range from market data for the role and city, anchored slightly above your target, and stay flexible on total compensation. 'Based on market data for this role in this city, I am looking at X to Y, and I am open to discussing the full package.'"],
  ["Are you interviewing with other companies?", "Honesty works here: a calm yes shows you are a credible candidate, and saying the role's fit attracts you most signals genuine interest. Never brag about offers as leverage; never lie, since it surfaces eventually."],
  ["Do you have any questions for us?", "Always ask two or three: 'What does success look like in the first six months?', 'How does the team handle model deployment and monitoring?', 'What do you enjoy most about working here?' No questions signals low interest; salary-only questions at this stage signal wrong priorities."],
  ["Are you willing to relocate or travel?", "Answer directly and honestly about your constraints first, then show flexibility where it exists. If relocation is hard, say so clearly and ask about hybrid options rather than over-promising and quitting later."],
  ["Why is there a gap in your employment?", "Keep it brief, factual, and forward-moving: what you did in the gap, such as upskilling with courses, projects, freelancing, or family responsibilities, and how it makes you sharper now. No apologies, no oversharing; steer back to your readiness for this role."],
  ["What do you know about our company?", "Prepare three facts: what the company does and for whom, one recent product, funding, or news item, and how the team you are joining fits the mission. Deliver them naturally inside your 'why here' answer rather than reciting like a quiz."],
  ["Tell me about your biggest professional achievement.", "Pick one with measurable impact and a clear personal contribution: 'I built the demand forecasting model that cut stockouts 18 percent across 40 stores.' Use STAR, quantify everything, and explain why it mattered to the business, not just to you."],
  ["How would your friends or colleagues describe you?", "Choose three traits the role rewards, each with a one-line anecdote: reliable under deadlines, curious about tooling, calm in incidents. Quoting a past review or a mentor's phrase adds authenticity."],
  ["What did you like most about your last role?", "Pick something real that transfers to this job, such as ownership, mentoring, or the modeling problems, and explain why. It signals what environment you seek; pair it with what you hope to find here."],
  ["What did you dislike about your last role?", "Choose a neutral structural constraint, like limited data infrastructure or slow release cycles, not people, and show what you did about it and what you learned. Never badmouth; keep it to one dislike and pivot to what you are seeking."],
  ["Explain a gap between what you studied and what you do.", "Turn it into a growth story: coursework built foundations, and projects or self-learning added the practical stack. Show the bridge artifacts, like certifications, Kaggle projects, or open-source work, that prove continuous learning."],
  ["How do you prioritize when everything is urgent?", "Describe a real method: impact versus effort ranking, stakeholder alignment on deadlines, breaking work into shippable slices, and communicating trade-offs early. Give one concrete example where prioritization saved a deliverable."],
  ["Describe your ideal work environment.", "Align honestly with what the company offers: collaborative, data-driven, autonomous with clear ownership. Avoid listing perks or contradicting the reality of the team, since interviewers check fit signals here."],
  ["What are your hobbies outside work?", "Mention one or two genuine interests briefly and connect skills where natural: chess and strategy, blogging and communication, sports and teamwork. Authenticity beats impressiveness; a short warm answer keeps it human."],
  ["If you got a better offer from another company after joining us, what would you do?", "Show commitment and maturity: you evaluate opportunities on growth, learning, and team, not only money, and job-hopping purely for small raises damages long-term growth. Express that you would raise concerns openly internally first. This tests loyalty signals, so avoid both rigid vows and cavalier talk."],
  ["Sell me this pen.", "Tests structured persuasion: ask about their needs first, match features to those needs, handle one objection, and close with a ask. 'How often do you sign important documents? A pen you trust matters then; this one writes smoothly and never leaks. Shall we say you will try it this week?' Structure matters far more than the close."],
];

const section = {
  id: SECTION_ID,
  title: "HR Interview",
  intro:
    "Human Resources round: behavioral fit, salary, culture, and communication. Answer with structure and honesty.",
  source: "hr",
  questions: HR.map(([text, answer], i) => ({
    id: String((SECTION_ID + 1) * 1000 + i + 1),
    num: i + 1,
    text,
    note: null,
  })),
};

bank.sections.push(section);
writeFileSync("src/data/questions.json", JSON.stringify(bank, null, 1));

// Also write curated answers into answers-ai.json (shared answers store)
const answers = JSON.parse(readFileSync("src/data/answers-ai.json", "utf8"));
for (let i = 0; i < HR.length; i++) {
  answers[String((SECTION_ID + 1) * 1000 + i + 1)] = HR[i][1];
}
writeFileSync("src/data/answers-ai.json", JSON.stringify(answers, null, 1));

const total = bank.sections.reduce((n, s) => n + s.questions.length, 0);
console.log(
  `HR section added: ${HR.length} questions with full answers. Bank total: ${total} questions, ${bank.sections.length} sections.`
);
