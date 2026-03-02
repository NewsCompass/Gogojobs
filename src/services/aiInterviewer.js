import { GoogleGenerativeAI } from "@google/generative-ai";
import { INTERVIEW_KNOWLEDGE_BASE } from "../utils/knowledgeBase";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * AI Interviewer Service
 * Uses Google Gemini to analyze CVs and generate contextual questions.
 */

export const generateInterviewStructure = async (cvText, jobRole = "", jobDescription = "") => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `
      You are a World-Class Executive Recruiter at a Tier-1 Tech Firm. You have 20 years of experience 
      and you can smell bullshit from a mile away. You fully understand strict UK hiring budgets, flight risks, 
      and corporate hierarchies.
      
      CRITICAL UK STANDARDS TO ENFORCE:
      ${INTERVIEW_KNOWLEDGE_BASE}

      TARGET JOB ROLE: ${jobRole || 'High-level Professional Role'}
      TARGET JOB DESCRIPTION: ${jobDescription || 'N/A'}
      
      CANDIDATE CV CONTENT:
      ${cvText}
      
      YOUR TASK:
      Analyze this CV against the TARGET JOB DESCRIPTION. Generate a highly realistic, standard UK interview flow.
      UK interviews are formal, structured, and heavily rely on Competency-Based Interviewing (CBI).
      DO NOT use American Silicon-Valley style "curveballs".
      
      CRITICAL INSTRUCTION: EVERY question MUST be explicitly tailored to the provided CV and Job Description. 
      DO NOT generate generic questions. Quote specific projects from their CV or specific requirements from the JD.
      
      GENERATE EXACTLY 5 QUESTIONS FOLLOWING THIS STRICT UK STRUCTURE:
      1. CV Deep Dive: Directly question a specific, meaty project from the CV. Ask them to explain a complex technical decision they made on THAT project.
      2. Competency (Behavioral): Find a requirement in the JD (e.g., stakeholder management, scaling systems). Ask for a STAR method example from their past where they demonstrated this.
      3. Commercial Awareness: Tie a technical achievement on their CV to a commercial outcome. Ask them to quantify the business impact.
      4. Situational (Technical/Role): Present a specific, difficult scenario they would likely face in the TARGET JOB ROLE based on the JD. Ask how they would solve it.
      5. Motivational: "Looking at the responsibilities in this JD, why does this specific role at this specific business align with your career trajectory?"
      
      RETURN FORMAT (Strict JSON Only):
      {
        "questions": [
          {
            "id": number,
            "type": "cv_deep_dive" | "competency" | "commercial_awareness" | "situational" | "motivational",
            "question": "The exact wording of the question you would ask the candidate in a formal UK interview",
            "hint": "What specific competency or metric you are evaluating in their answer"
          }
        ],
        "rawAnalysis": {
          "innerMonologue": "What you REALLY think about this candidate. Be blunt. (e.g. 'He's overcompensated for his actual skill level', 'This gap looks suspicious', 'She's a perfect hire but will quit in 6 months for a startup').",
          "hierarchyFit": "Where they actually sit in the food chain (Staff, Senior, Entry) and why.",
          "budgetRisk": "High/Medium/Low risk. Are they too expensive? Are they overqualified? Are they a 'placeholder' hire?",
          "redFlags": ["List of actual concerns a human would have"]
        }
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonStr);

        // Fallback if structure is wrong
        if (data.questions && data.rawAnalysis) {
            return data;
        } else if (Array.isArray(data)) {
            return { questions: data, rawAnalysis: { innerMonologue: "Analysis failed to generate.", hierarchyFit: "Unknown", budgetRisk: "Neutral", redFlags: [] } };
        }

        throw new Error("Invalid format from Gemini");
    } catch (error) {
        console.error("Gemini Question Generation Error:", error);
        // Fallback to strict UK standards if API fails
        return {
            questions: [
                { id: 1, type: 'cv_deep_dive', question: "Can you talk me through your most significant technical project on your CV?", hint: "Looking for specific, quantifiable contributions." },
                { id: 2, type: 'competency', question: "Describe a situation where you had to manage a difficult stakeholder. What was the outcome?", hint: "Must use the STAR method." },
                { id: 3, type: 'commercial_awareness', question: "Tell me about a time your technical work directly impacted the business bottom line.", hint: "Looking for understanding of business value." },
                { id: 4, type: 'situational', question: "If you were to start this role tomorrow, how would you approach the technical challenges listed in the job description?", hint: "Testing practical application and planning." },
                { id: 5, type: 'motivational', question: "Why are you interested in this specific role at this stage in your career?", hint: "Testing true motivation vs just looking for a paycheck." }
            ],
            rawAnalysis: {
                innerMonologue: "System error during analysis. Defaulting to standard UK questions.",
                hierarchyFit: "Unable to determine",
                budgetRisk: "Unknown",
                redFlags: ["System Timeout"]
            }
        };
    }
};

export const getRealTimeFeedback = (transcription, metrics) => {
    // This will eventually be powered by a real-time LLM stream or Vapi analysis
    const fillerWords = ['um', 'uh', 'like', 'actually', 'sort of'];
    const count = fillerWords.reduce((acc, word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        return acc + (transcription.match(regex) || []).length;
    }, 0);

    return {
        sentiment: metrics.sentiment || 'Neutral',
        pace: metrics.wpm || 0,
        fillerCount: count,
        advice: count > 3 ? "Try to slow down and embrace silence instead of using 'um' or 'like'." : "Good pacing!"
    };
};
