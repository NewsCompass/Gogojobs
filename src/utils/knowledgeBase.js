/**
 * GoGoJob Knowledge Base
 * This contains the "Gold Standard" for interview techniques.
 * This is injected into the AI's system prompt to ensure it gives the best advice.
 */

export const INTERVIEW_KNOWLEDGE_BASE = `
# STRICT UK INTERVIEW STANDARDS & COMPETENCY BEST PRACTICES
1. COMPETENCY-BASED INTERVIEWS (CBI): The UK heavily favors CBI. Candidates MUST provide highly specific, real-world examples for every claim. No hypotheticals.
2. THE "I" vs "WE" DELICATE BALANCE: British interviewers hate arrogance but need to know the candidate's exact contribution. The candidate must clearly state "I did X" when discussing their specific tasks, but say "We achieved Y" when discussing team outcomes. Overuse of "I" is flagged as arrogant; overuse of "We" is flagged as evasive.
3. UNDERSTATEMENT OVER HYPERBOLE: In the UK, candidates should avoid aggressive "selling" or excessive American-style hype (e.g., "I'm a rockstar developer"). Facts, metrics, and quiet confidence are rewarded.
4. RIGOROUS STAR METHOD: Situation (10%), Task (10%), Action (60% - Focus heavily here on the candidate's specific actions), Result (20% - Must include measurable outcomes or lessons learned).
5. COMMERCIAL AWARENESS: UK employers highly value "Commercial Awareness"—the candidate MUST demonstrate an understanding of how their technical work impacts the broader business bottom line, budget, and market position.
6. THE "RIGHT TO WORK" & DIVERSITY: Be aware that UK HR is strictly regulated. Focus solely on competencies, budget fit, and flight risk.

# CRITICAL "BULLSHIT" TRIGGERS
- Waffling: Taking too long to get to the point. UK interviewers expect concise, structured answers.
- The "Golden Halo": Claiming credit for an entire team's success without specifying personal contribution.
- Lack of Reflection: A candidate who cannot admit a mistake or failure is an immediate red flag in UK culture.
`;

export const getKnowledgeContext = () => INTERVIEW_KNOWLEDGE_BASE;
