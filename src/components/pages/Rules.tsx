import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import "./Rules.css";

const Rules: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState(0);

  const handleGoBack = () => {
    window.scrollTo(0, 0);
    navigate("/");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const index = parseInt(id.split("-")[1], 10);
            if (!isNaN(index)) {
              setSelectedSection(index);
            }
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    const sections = document.querySelectorAll(".rules-section");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const rules = [
    {
      category: "Respect and Conduct",
      rules: [
        { title: "1.1 Respect All Players and Staff", description: "Maintain respect for all players and staff, both in-character and out-of-character. Harassment or insults will not be tolerated." },
        { title: "1.2 Stay in Character (IC)", description: "Remain in character during interactions unless an emergency calls for out-of-character (OOC) chat, and use OOC sparingly." },
        { title: "1.3 Limit Use of Out-of-Character (OOC) Chat", description: "Use OOC chat only when absolutely necessary, and avoid disrupting the in-character flow. Keep OOC comments to a minimum." },
        { title: "1.4 No Toxic or Offensive Roleplay", description: "Avoid any roleplay involving racism, sexism, or hate speech. Keep interactions inclusive and respectful to all." },
        { title: "1.5 No Forced Romance or Sexual Content", description: "Avoid forcing romantic or suggestive situations on others. Obtain consent before engaging in any intimate roleplay." },
        { title: "1.6 Keep Personal Issues Out of Roleplay", description: "Avoid bringing real-life issues or conflicts into the roleplay environment. Address personal concerns in private with staff if needed." },
        { title: "1.7 No Advertising Other Servers", description: "Refrain from discussing or promoting other RP servers. Respect the exclusivity of Synthwave Roleplay." }
      ]
    },
    {
      category: "Combat and Interactions",
      rules: [
        { title: "2.1 No Random Deathmatching (RDM)", description: "Attacking or killing others without a valid in-character reason is strictly forbidden. Roleplay must drive every confrontation and encounter." },
        { title: "2.2 No Powergaming", description: "Do not force outcomes or perform actions that your character wouldn’t realistically be able to achieve. Respect others' roles and limitations." },
        { title: "2.3 No Metagaming", description: "Avoid using out-of-character information to make in-character decisions. Maintain the integrity of your character's knowledge." },
        { title: "2.4 Fear Roleplay (FearRP)", description: "Treat your character’s life as you would your own. Show fear and caution in high-stakes situations." },
        { title: "2.5 Roleplay Consequences", description: "Accept the outcomes of your actions. Decisions carry weight, and avoiding consequences disrupts immersion for others." },
        { title: "2.6 No Combat Logging", description: "Stay connected until all interactions are complete, even if it puts your character at risk. Disconnecting to avoid consequences is unfair." },
        { title: "2.7 New Life Rule (NLR)", description: "When your character dies, they forget the circumstances leading up to it. Do not seek revenge or return to the scene." },
        { title: "2.8 Kidnapping and Hostage Rules", description: "Kidnapping or taking hostages must be roleplay-driven and not random. There must be a clear story purpose behind it." },
        { title: "2.9 Illegal Activities and Law Enforcement Interaction", description: "Respect police responses when engaging in criminal activities. Avoid excessive aggression or escalation without strong in-character reasons." }
      ]
    },
    {
      category: "Character and Realism",
      rules: [
        { title: "3.1 Character Believability", description: "Portray a realistic character and avoid superhuman actions. Ground your character with strengths and flaws to deepen the RP experience." },
        { title: "3.2 Realistic Driving", description: "Drive sensibly, as you would in real life. Unnecessary speeding or crashes disrupt the RP experience and are discouraged." },
        { title: "3.3 No Child Characters", description: "Playing as a child character in adult or violent scenarios is not allowed. This rule helps maintain a respectful environment." }
      ]
    },
    {
      category: "Technical Rules and Server Respect",
      rules: [
        { title: "4.1 No Cheating or Exploiting", description: "Cheating, hacking, or exploiting any bugs to gain unfair advantages is prohibited and will lead to severe consequences." },
        { title: "4.2 Report Bugs or Issues", description: "Report any bugs or glitches to server staff. Exploiting bugs harms gameplay balance and will be penalized." },
        { title: "4.3 Respect Server Events and Storylines", description: "Participate in server events and avoid disrupting official storylines. Help build a cohesive narrative for everyone." },
        { title: "4.4 Listen to Admins and Moderators", description: "Follow server staff instructions. Admins are there to ensure fairness and an enjoyable experience for everyone." }
      ]
    }
  ];

  return (
    <div className="rules-container">
      <Helmet>
        <title>Server Rules | Synthwave Roleplay</title>
        <meta name="description" content="Official server rules for Synthwave Roleplay. Please read carefully to ensure a fun and immersive experience for everyone." />
        <link rel="canonical" href="https://synthwave.in/rules" />
      </Helmet>
      <aside className="rules-sidebar">
        {rules.map((section, index) => (
          <a
            key={section.category}
            className={index === selectedSection ? "active" : ""}
            href={`#rules-${index}`}
            onClick={() => setSelectedSection(index)}
          >
            {section.category}
          </a>
        ))}
      </aside>
      <main className="rules">
        <header className="rules-header">
          <nav aria-label="breadcrumb" className="breadcrumb">
            <a href="/">Home</a> &gt; <span>Rules</span>
          </nav>
          <span className="rules-eyebrow">SYNTHWAVE ROLEPLAY</span>
          <h1>SERVER RULES</h1>
          <p className="rules-intro">Build a believable world together. Respect the story, respect the community, and keep every scene worth remembering.</p>
        </header>
        <section className="rules-list">
          {rules.map((section, index) => (
            <article key={index} id={`rules-${index}`} className="rules-section">
              <h2 className="category-title">{section.category}</h2>
              {section.rules.map((rule, ruleIndex) => (
                <div key={ruleIndex} className="rule-item">
                  <h3>{rule.title}</h3>
                  <p><span className="rule-marker">◆</span>{rule.description}</p>
                </div>
              ))}
            </article>
          ))}
        </section>
        <div className="rules-buttons">
          <button onClick={handleGoBack} className="rules-button" aria-label="Go back to the home page">RETURN HOME</button>
        </div>
      </main>
    </div>
  );
};

export default Rules;
