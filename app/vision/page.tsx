import { PageIntro } from "@/components/editorial";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Vision",
  "Long-term ambitions in high-speed rail, aerospace, semiconductors, and memory.",
  "/vision",
);
const visions = [
  [
    "01",
    "High-speed rail",
    "Bringing places closer.",
    "Fast, reliable rail can change the relationship between cities and the people who move between them. Our long-term vision includes contributing to the technologies behind high-speed and bullet train systems.",
  ],
  [
    "02",
    "Aerospace & propulsion",
    "Thinking beyond familiar limits.",
    "Aerospace and jet propulsion represent some of engineering’s most demanding challenges. They are part of our long-term ambition to understand and contribute to the systems that make flight possible.",
  ],
  [
    "03",
    "Semiconductors",
    "At the foundation of possibility.",
    "Semiconductors underpin modern computing. Our long-term vision includes exploring the technologies, engineering disciplines, and infrastructure behind the chips that power our world.",
  ],
  [
    "04",
    "Memory & RAM",
    "Making room for what comes next.",
    "Memory shapes what computers can do and how efficiently they do it. We see memory and RAM technology as a long-term field of interest alongside our broader computing ambitions.",
  ],
];
export default function Vision() {
  return (
    <>
      <PageIntro number="03" eyebrow="VISION" title="The long view.">
        <p>
          Ambition gives us a direction. Software and AI are where we begin.
          These are the fields we hope to contribute to over time.
        </p>
        <p className="small-note">
          The following areas are future ambitions. They are not current
          products, operational facilities, or launched programs.
        </p>
      </PageIntro>
      <section className="section vision-editorial">
        {visions.map(([number, title, heading, body]) => (
          <article key={number}>
            <div className="vision-side">
              <span>{number}</span>
              <span className="future-label">LONG-TERM VISION</span>
            </div>
            <div>
              <span className="eyebrow">{title}</span>
              <h2>{heading}</h2>
              <p>{body}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
