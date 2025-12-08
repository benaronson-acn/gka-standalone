import { AnalysisSession, Persona } from './types';

export const DefaultPersonas: Persona[] = [
  { 
    id: "default_ayesha", 
    name: "Ayesha", 
    content: "I am a 34-year old black woman living in Atlanta, Georgia starting my own fashion business. I have never started my own business before but have been able to sell some of my clothing as a vendor at small events. I am looking for grant opportunities to help me scale and mentorship to figure out where to go next to grow my business.",
    isDefault: true
  },
  { 
    id: "default_karla", 
    name: "Karla", 
    content: "I am a 63-year old black woman living in Tulsa, Oklahoma running a small transportation business to help the elderly move around in my community. I have been able to operate this business for over a year, am making some money, and would now like help with scaling the business to add a new vehicle to our fleet. I am looking for grants to help with this.",
    isDefault: true
  },
  { 
    id: "default_rodrigo", 
    name: "Rodrigo", 
    content: "I am a 2nd generation immigrant from Venezuela running my own life coaching business to help other children of immigrants figure out where to go in life. I have a few clients that I know personally but am looking for help to grow my business.",
    isDefault: true
  },
  { 
    id: "default_eugene", 
    name: "Eugene", 
    content: "I am a member of the LGBT and AAPI communities in Cleveland, Ohio who wants to start my own accounting business for young people in my communities. I am looking for mentorship on how to launch this business, guidance on how to go about this, and grant funding opportunities would be a plus.",
    isDefault: true
  }
];

export const MockSession: AnalysisSession = {
  id: 999999999, // Static ID for the mock
  timestamp: "10/25/2023, 10:30:00 AM", // Static timestamp
  keyword: "sky's the limit",
  prompts: [{ id: 12345, value: "entrepreneur mentorship opportunities" }],
  results: [{
    promptNumber: 1,
    prompt: "entrepreneur mentorship opportunities",
    iterationResults: [{
      iterationNumber: 1,
      response: `There are many great entrepreneur mentorship opportunities available, depending on your specific needs and where you are in your entrepreneurial journey. Here's a breakdown of common types and how to find them:

I. Types of Mentorship Opportunities:

Formal Programs: Structured programs offered by organizations, accelerators, incubators, or universities. These often involve applications, a selection process, and a defined mentorship period with specific goals.
Pros: Clear structure, often curated matches, access to a network, potential for additional resources (funding, office space).
Cons: Competitive, may have specific industry or stage requirements, less flexibility.
Informal Mentorship: Relationships that develop organically through networking, mutual connections, or direct outreach.
Pros: Highly flexible, can be tailored to your exact needs, often more personal.
Cons: Requires proactive effort, no guarantee of finding a mentor, relationship building takes time.
Peer Mentorship: Connecting with other entrepreneurs at a similar stage or facing similar challenges.
Pros: Mutual understanding, shared experiences, safe space for vulnerability, often less intimidating than a seasoned mentor.
Cons: May lack the deep experience of a veteran mentor, can sometimes lead to "the blind leading the blind" if not balanced with other advice.
Micro-Mentorship/Advisory Boards: Seeking specific advice from multiple experts on particular topics rather than one long-term mentor.
Pros: Targeted advice, less time commitment from any one individual, diverse perspectives.
Cons: Not a traditional long-term mentorship, requires you to know exactly what questions to ask.
II. Where to Find Mentorship Opportunities:

A. Online Platforms & Directories:

SCORE (Service Corps of Retired Executives): A fantastic free resource in the US. They connect aspiring and established entrepreneurs with experienced business mentors (often retired executives) for free, confidential one-on-one counseling. They also offer workshops and resources.
Website: www.score.org
Mentorship Platforms:
MicroMentor (by Mercy Corps): Connects entrepreneurs with business mentors worldwide for free. You can search by industry, expertise, and location.
MentorCruise: A paid platform offering access to experienced mentors in various tech and business fields. Good for targeted, high-quality advice.
ADPList: Offers free 1:1 mentorship sessions, primarily focused on design, product, and tech, but expanding.
PlatoHQ: Focuses on leadership and engineering mentorship for tech companies.
LinkedIn:
Search: Use keywords like "mentor," "advisor," "entrepreneur," "startup" to find people in your industry.
LinkedIn Groups: Join groups related to entrepreneurship, your industry, or specific business challenges. Participate actively and build connections.
Alumni Network: Leverage your university's alumni network on LinkedIn. Many alumni are eager to help fellow graduates.
Direct Outreach: Once you identify potential mentors, send a personalized, concise message explaining why you admire their work and what specific advice you're seeking.
B. Incubators, Accelerators, and Startup Hubs:

These programs are specifically designed to support early-stage companies and almost always include a robust mentorship component.

Examples: Y Combinator, Techstars, 500 Startups, local university incubators, industry-specific accelerators.
How to find: Search for "startup accelerators [your city/industry]," "business incubators [your city]," "entrepreneurship centers."
C. Industry-Specific Organizations & Associations:

Many industries have professional associations that offer mentorship programs or networking events.

Examples: National Association of Women Business Owners (NAWBO), Entrepreneurs' Organization (EO), industry-specific chambers of commerce, American Marketing Association (AMA).
How to find: Search for "[your industry] association," "[your profession] organization."
D. Local Resources:

Chambers of Commerce: Often have small business support programs, networking events, and can connect you with local business leaders.
Small Business Development Centers (SBDCs): US-based centers that provide free business consulting, training, and resources, including connections to mentors.
Website: www.sba.gov/sbdc
Universities & Colleges: Many have entrepreneurship centers, alumni networks, or business schools that offer mentorship programs for students and sometimes the wider community.
Co-working Spaces: These hubs for entrepreneurs often host events, workshops, and facilitate connections among members.
E. Networking Events & Conferences:

Industry Conferences: Attend conferences relevant to your field. Many offer "mentor hours" or dedicated networking sessions.
Startup Meetups: Websites like Meetup.com host numerous entrepreneurship and startup groups. Attending these is a great way to meet potential mentors and peers.
Local Business Events: Look for events hosted by your city, local business groups, or chambers of commerce.
III. Tips for Finding and Engaging a Mentor:

Be Clear About Your Needs: What specific areas do you need help with (e.g., fundraising, marketing, product development, leadership)?
Do Your Homework: Research potential mentors thoroughly. Understand their background, achievements, and what makes them a good fit.
Make a Specific Ask: When reaching out, don't just say "will you be my mentor?" Instead, ask for a specific, small amount of their time (e.g., "Would you be open to a 15-minute call to discuss X?").
Offer Value (If Possible): Even if you're early in your journey, think about how you might offer value in return (e.g., connecting them to someone, offering to help with a small task, sharing insights from your niche).
Be Respectful of Their Time: Mentors are busy. Be prepared, send an agenda, follow up promptly, and don't overstay your welcome.
Listen Actively & Take Action: Show that you value their advice by listening and implementing their suggestions (or explaining why you chose a different path).
Show Gratitude: Always thank your mentor for their time and insights. Update them on your progress.
Consider Multiple Mentors: You don't need just one mentor. You might have different mentors for different aspects of your business or life.
By exploring these avenues and being proactive, you significantly increase your chances of finding valuable entrepreneur mentorship opportunities.`,
      keywordFound: false,
      keywordFoundStatusText: "❌ Not Found",
    }],
    summaryStatus: false,
    summaryStatusText: "❌ Not Found",
  }],
  iterations: 1,
  context: "", // Assuming no context for this mock
  isContextEnabled: false,
  useSearch: false,
  isTargetUrlEnabled: true,
  targetUrl: "",
};