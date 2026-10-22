import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head,
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-foreground">About Magen Global</h1>
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Our Mission</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Magen Global is an independent safety intelligence service for Jews living or travelling outside Israel. We monitor the evolving antisemitic climate on the ground, country by country, tracking attacks, threats, harassment, demonstrations near Jewish institutions, and other forms of targeting against Jewish individuals and communities.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">By turning verified information into clear, timely, and actionable alerts, we help Jewish communities stay informed, assess risks, and make better-informed decisions about their safety.</p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">How We Work</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Magen Global brings together official government advisories, reporting from established news organisations, and information from trusted community security networks to provide a clearer picture of the evolving security environment facing Jewish communities worldwide.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">We distinguish between official guidance, verified news reporting, and community-reported information. Every alert identifies its source category and links to the original source wherever available, enabling users to review the underlying information and assess it for themselves.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Our systems automate the collection and summarisation of information. Automated summaries are intended to help users understand reported developments quickly; they are not a substitute for the original reporting, independent verification, or official security advice.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Headlines from the GDELT Project are also used to help identify developing stories and link users to original publishers.</p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">How Our Alerts Are Classified</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Every alert is assigned a source classification and a severity level. These serve different purposes: the source classification explains where the information comes from, while the severity level indicates the potential urgency of the reported situation.</p>
        <h3 className="mt-5 font-display text-base font-semibold text-foreground">Source classifications</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Tier 1 — Official Sources</strong></p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Information issued or directly confirmed by an official authority, such as a government travel advisory or emergency service. These sources provide formal guidance and are labelled <em>Official source</em>.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Tier 2 — Verified News</strong></p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Automated summaries of reporting from established news organisations, with links to the original articles. These alerts help users identify relevant developments quickly and are labelled <em>Automated summary of reporting by publishers</em>.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Tier 3 — Trusted Community Security</strong></p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Information reported by vetted community security networks, local security coordinators, or established neighbourhood watch contacts. These sources can provide valuable local context but are not official authorities. They are labelled <em>Trusted community security source</em>.</p>
        <h3 className="mt-5 font-display text-base font-semibold text-foreground">Severity levels</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Critical</strong> — An imminent or life-threatening danger. Act immediately and follow official instructions.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">High</strong> — A serious, credible threat. Take protective action and monitor official channels.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Moderate</strong> — A credible but contained threat. Stay alert and review your safety plans.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Low</strong> — A minor or geographically limited event that warrants awareness.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Info</strong> — Relevant context or background information with no immediate action indicated.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Severity levels are intended to support situational awareness and decision-making. They do not guarantee the safety of any location or individual, and users should always consider the circumstances on the ground and any official instructions.</p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Our Sources</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Magen Global draws on a range of official, journalistic, and community information sources, including:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li><strong className="font-semibold text-foreground">Official guidance:</strong> US Department of State Travel Advisories.</li>
          <li><strong className="font-semibold text-foreground">Verified news reporting:</strong> BBC News, The Guardian, and JTA.</li>
          <li><strong className="font-semibold text-foreground">Developing stories:</strong> Headlines identified through the GDELT Project.</li>
          <li><strong className="font-semibold text-foreground">Community security:</strong> Information from trusted community security contacts and networks, where available.</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Sources are identified according to their role and classification. We encourage users to follow the original reporting and consult relevant authorities when assessing a potential threat.</p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Transparency and Limitations</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Our priority is to make relevant safety information easier to find, understand, and verify. We are committed to transparent sourcing, clear alert classifications, and an honest distinction between reported information and official guidance.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Users should be aware of the following limitations:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li><strong className="font-semibold text-foreground">Automated processing:</strong> Information collection and summarisation are automated. Errors, omissions, delays, and inaccuracies may occur.</li>
          <li><strong className="font-semibold text-foreground">Source verification:</strong> A link to a news report or community report does not, by itself, mean that every detail has been independently verified by Magen Global.</li>
          <li><strong className="font-semibold text-foreground">Mapping limitations:</strong> Geographic locations and map markers are based on available source information and may be incomplete or imprecise. A map marker does not establish that an area is safe or unsafe.</li>
          <li><strong className="font-semibold text-foreground">Coverage limitations:</strong> Our monitoring cannot capture every incident, threat, or development. The absence of an alert does not mean the absence of risk.</li>
          <li><strong className="font-semibold text-foreground">Official guidance:</strong> Magen Global complements, but does not replace, government advisories, emergency services, professional security advice, or local instructions.</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Magen Global is an information and situational-awareness service, not an emergency response provider. In an immediate emergency, contact the relevant local emergency services and follow official instructions.</p>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Contact Us</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">We welcome corrections, relevant information, and feedback that can help improve the accuracy and usefulness of our service.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><Link to="/contact" className="font-semibold text-primary underline underline-offset-2 hover:opacity-80">Contact us</Link> to report an error, suggest a source, or share information relevant to the safety of Jewish communities.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Please also review our <Link to="/privacy" className="font-semibold text-primary underline underline-offset-2 hover:opacity-80">Privacy Statement</Link> to understand how information is handled when using Magen Global.</p>
      </section>
    </div>
  );
}

export function head() {
  const title = "About Magen Global — Mission, Sources and Transparency";
  const description = "Learn about Magen Global’s safety intelligence mission, source classifications, severity levels, transparent sourcing and limitations.";
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
